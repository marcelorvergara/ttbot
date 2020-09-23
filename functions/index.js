//functions
const functions = require('firebase-functions');
const admin = require("firebase-admin");
const serviceAccount = require("./autott.json");
const https = require('https');
const http = require('http');
const Vergara = require('./Vergara')
const Twit = require('twit');
const client = new Twit(Vergara);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://auto-tt.firebaseio.com"
});
//ouve se entrou palavra chave no banco
exports.getkw = functions.firestore
    .document('funclistener/{id}')
    .onWrite(async (change, context) => {
        const palavra = change.after.data().kwStr;
        const hashtags = change.after.data().hashtags;
        const onde = change.after.data().onde;
        const idioma = change.after.data().idioma;
        const numPub = change.after.data().numPub;

        //vamos atualizar o banco com as matérias chamando a função its automatic
        return new Promise((resolve, reject) => {
            const hostname = 'us-central1-auto-tt.cloudfunctions.net';
            const pathname = '/itsautomatic';
            const kw = encodeURI(`?kw=`+`${palavra}`);
            const hts = encodeURI(`&hts="`+`${hashtags}`+'"');
            const od = `&od=`+`${onde}`;
            const id = `&id=`+`${idioma}`;
            const mp = `&mp=`+`${numPub}`;
            let data = '';
            const request = https.get(`https://${hostname}${pathname}${kw}${hts}${od}${id}${mp}`, (res) => {
                res.on('data', (d) => {
                    data += d;
                });
                res.on('end', resolve);
            });
            console.log("link itsautomatic", `https://${hostname}${pathname}${kw}${hts}${od}${id}${mp}`);
            request.on('error', reject);
        });
    })
//busca notícias e guarda no banco
exports.itsautomatic = functions.https.onRequest((request, response) => {
    const data0 = hoje();
    const data1 = semanaOld();
    const kw = request.query.kw;
    const hts = request.query.hts;
    const od = request.query.od;
    const id = request.query.id;
    const mp = request.query.mp;
    const mpNum = parseInt(mp);
    //pegar a palavra chave
    let db = admin.firestore();
    var totalResults;
    var linkApi = decodeURI(`http://newsapi.org/v2/everything?`+`${od}`+`="`+`${kw}`+`"&language=`+`${id}`+`&from=`+`${data1}`+`&to=`+`${data0}`+`&pageSize=20&apiKey=3f7f28b3102a4dfea37f48f8bcf558cf`);
    console.log("link news", linkApi);
    var req = require('request');
    req.get(linkApi,function(err,res,body){
        if(err) {
            console.log("Não foi possível realizar requisição: " + err);
        }
            if(res.statusCode === 200 ) {
                json_data = JSON.parse(body);
                totalResults = json_data.totalResults;
                if (totalResults === 0){
                    console.log("Nenhum resuldado encontrado")
                }else{
                    if (totalResults >= mpNum){
                        totalResults = mpNum;
                    }
                    for (let i = 0; i < totalResults; i++){
                        const link = json_data.articles[i].url;
                        matDb = db.collection('materias');
                        let query = matDb.where("url", "==", link).get()
                            .then(snapshot => {
                                if (snapshot.empty){
                                    console.log("URL não encontrada no BD. Vamos publicar!")
                                    const dataMat = new Date(Date.now());
                                    const { v4: uuidv4 } = require('uuid');
                                    const uuid = uuidv4();
                                    const artigo = {
                                        url: link,
                                        publicado: false,
                                        dataTs: dataMat,
                                        idMat: uuid,
                                        hts: hts
                                    }
                                    const insert = inserirMat(uuid,artigo);
                                }else {
                                    console.log("Matéria repetida não completa álbum!")
                                }
                            })
                    }
                }
                response.send("Ok, concluído o download das matérias. Total: " + totalResults)
            }
    })

});
//disparo no tt
exports.autoPost = functions.firestore
    .document('materias/{idMat}')
    .onCreate(async (snap, context) => {
        const materia = snap.data();
        const htList = snap.data().hts;
        const hts = HashTag(htList);
            client.post('statuses/update', { status: `${hts}\n${materia.url}` },
            (err, data, response) => {
                if(err) {
                    return err
                }
                else {
                    console.log("Matéria postada!!!");
                    const uptade = updateMat(materia.idMat);
                }
            })
    })
//dispário diário
exports.pubDiario = functions.pubsub
    .schedule('every 30 minutes')
    .onRun((context) => {
        const hostname = 'us-central1-auto-tt.cloudfunctions.net';
        const pathname = '/itsautomatic';
        const kw = '?kw=flamengo';
        const hts = '&hts=CRF,Flamengo,naçãorubronegra,maiordomundo,rubronegro,mengão,FechadoComFlamengo,SomosUmaNação';
        const od = '&od=q';
        const id = '&id=pt';
        const mp = '&mp=15';
        return new Promise((resolve, reject) => {
            let data = '';
            const url = encodeURI(`https://${hostname}${pathname}${kw}${hts}${od}${id}${mp}`)
            const request = https.get(url, (res) => {
                res.on('data', (d) => {
                    data += d;
                });
                res.on('end', resolve);
            });
            request.on('error', reject);
        });
    });
//funções auxiliares
function semanaOld(){
    //um dia atrás
    var old = new Date(Date.now() - 24 * 60 * 60 * 1000);
    console.log(old.toISOString().slice(0,10))
    return old.toISOString().slice(0,10);
}
function hoje(){
    var datetime = new Date();
    console.log(datetime.toISOString().slice(0,10))
    return datetime.toISOString().slice(0,10);
}
async function inserirMat(uuid, mat){
    let db = admin.firestore();
    return await db.collection('materias').doc(uuid).set(mat);
}
async function updateMat(matId){
    let db = admin.firestore();
    console.log(`\n\n\nMatéria publicada` + `${matId}`)
    const materiaDB = db.collection('materias').doc(matId);
    return await materiaDB.update({publicado: true});
}
function CriarRandom(array){
    for(let i = array.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * i)
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;

    }
    return array;
}
function HashTag(ht){
    const hashtags0 = ht.replace(/\s+/g, '');//tirando espaço
    const arrayList = hashtags0.split(",")//criando o array
    const hashtags1 = CriarRandom(arrayList);//randomizando
    const str = hashtags1.join();//voltando array para string
    const hashtags2 = str.replace(/,/g,' #');//trocando vírgula por hashtag
    const hts1 = hashtags2.replace(/"/g,'');//tirando os espaços
    hts = "#" + hts1;
    return hts;
}