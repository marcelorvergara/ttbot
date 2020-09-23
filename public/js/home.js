window.onload = function () {
    CheckLogin();
    CreateGrid();
    CreateInputs();
}

//front-end
function CreateGrid(){
    //h1 para robôs
    const  h1 = document.createElement("h1");
    h1.innerText = "App para publicar notícias de acordo com palavras-chave"

    //grid para inserção de conteúdo
    const grid = document.createElement("div");
    grid.className = "grid-container";

    for (let i=0; i<=2; i++){
        const divCh = document.createElement("div");
        divCh.id = `divID${i}`;
        grid.appendChild(divCh);
    }

    document.body.appendChild(grid);
}
function CreateInputs(){
    const divForm = document.createElement("div");
    divForm.className = "quadro";
    divForm.id = "mainDiv";
    //titulo
    var titulo = document.createElement("h2");
    titulo.innerText = "Notícias no Twitter";
    divForm.appendChild(titulo);
    //input para palavra
    var pNome = document.createElement("label");
    pNome.for = "palavras"
    pNome.innerText = "Insira a palavra chave: ";
    divForm.appendChild(pNome);
    var inputList = document.createElement("input");
    inputList.setAttribute('list','palavrachave')
    inputList.id = "palavras";
    inputList.name = "palavrachave";
    divForm.appendChild(inputList);
    divForm.appendChild(GetPalavras());
    //radio para titulo ou conteúdo
    const divPesq = document.createElement("div");
    divPesq.innerText = "Onde Pedquisar: "
    const radioConteudo = document.createElement("input");
    radioConteudo.type = "radio";
    radioConteudo.id = "q";
    radioConteudo.name = "tipoPesq";
    radioConteudo.className = "radioAgenda";
    divPesq.appendChild(radioConteudo);
    const labelCont = document.createElement("label");
    labelCont.id = "contLabel";
    labelCont.for = "conteudo";
    labelCont.className = "labelApi";
    labelCont.innerText = "Conteúdo";
    divPesq.appendChild(labelCont);
    const radioTitulo = document.createElement("input");
    radioTitulo.type = "radio";
    radioTitulo.id = "qInTitle";
    radioTitulo.name = "tipoPesq";
    radioTitulo.className = "radioAgenda";
    divPesq.appendChild(radioTitulo);
    const labelTit = document.createElement("label");
    labelTit.id = "tituloLabel";
    labelTit.for = "titulo";
    labelTit.className = "labelApi";
    labelTit.innerText = "Título";
    divPesq.appendChild(labelTit);
    divForm.appendChild(divPesq);

    //idioma
    const labelIdioma = document.createElement("label");
    labelIdioma.for = "idioma";
    labelIdioma.innerText = "Escolha o Idioma: "
    divForm.appendChild(labelIdioma);
    const inputIdioma = document.createElement("select");
    inputIdioma.name = "idioma";
    inputIdioma.id = "idioma";
    const idiomas = ["de","en","es","fr","it","nl","no"];
    const idiomasTxt = ["Deutsch","English","Español","français","Italiano","Nederlands","Norsk"];
    const optDef = document.createElement("option");
    optDef.value = "pt";
    optDef.innerText = "Português";
    optDef.selected;
    inputIdioma.appendChild(optDef);
    for (let i in idiomas){
        const opt = document.createElement("option");
        opt.value = idiomas[i];
        opt.innerText = idiomasTxt[i];
        inputIdioma.appendChild(opt);
    }
    divForm.appendChild(inputIdioma);

    const mainDiv = document.getElementById("divID1");
    mainDiv.appendChild(divForm)

    //segunda coluna
    const divForm2 = document.createElement("div");
    divForm2.className = "quadro";
    divForm2.id = "mainDiv2";

    //input para #
    var pHash = document.createElement("label");
    pHash.for = "hashtags"
    pHash.innerText = "Insira hashtags relevantes separadas por vírgula: ";
    divForm2.appendChild(pHash);
    var inputHash = document.createElement("textarea");
    inputHash.rows = "4";
    inputHash.cols = "30";
    inputHash.id = "hashtags";
    inputHash.name = "hashtags";
    divForm2.appendChild(inputHash);
    //máximo de resultados
    const labelMaxResults = document.createElement("label");
    labelMaxResults.for = "maxRes";
    labelMaxResults.innerText = "Escolha o Máximo de Publicações: "
    divForm2.appendChild(labelMaxResults);
    const inputMaxResults = document.createElement("select");
    inputMaxResults.name = "maxRes";
    inputMaxResults.id = "maxRes";
    const num = ["uma publicação","duas publicações","três publicações","quatro publicações",
        "cinco publicações","seis publicações","sete publicações","oito publicações","nove publicações",
        "dez publicações","onze publicações","doze publicações","treze publicações","quatorze publicações"]
    for (let i=0; i < 14; i++){
        const optMr = document.createElement("option");
        optMr.value = num[i];
        optMr.id = i +1;
        optMr.innerHTML = num[i];
        inputMaxResults.appendChild(optMr);
    }
    divForm2.appendChild(inputMaxResults);
    //button
    var pButton = document.createElement("p");
    divForm2.appendChild(pButton);
    var buttonCad = document.createElement("button");
    buttonCad.id = "cadastroBtn";
    buttonCad.addEventListener("click",InserirPalavra);
        buttonCad.innerText = "Enviar";
    pButton.appendChild(buttonCad);
    //resultado
    var pResult = document.createElement("p");
    pResult.id = "resultado";
    pButton.appendChild(pResult);

    const mainDiv2 = document.getElementById("divID2");
    mainDiv2.appendChild(divForm2)


}

//acesso ao back-end
function CheckLogin(){
    firebase.auth().onAuthStateChanged(user => {
        if(!user) {
            window.location = 'index.html';
        }else{
            LoginStatus()
        }
    });
}
function LoginStatus(){
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            const status = document.createElement("div");
            status.className = "status";
            status.innerText = `Olá ${user.email}`;
            const divStatus = document.getElementById("divID0");
            divStatus.appendChild(status);
        }
    });
}
function GetPalavras(){
    let db = firebase.firestore();
    var palavras = document.createElement("datalist");
    palavras.id = "palavrachave";
    db.collection("keywords")
        .orderBy("kwStr")
        .get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            // doc.data() is never undefined for query doc snapshots
            //console.log(doc.id, " => ", doc.data().nome);
            var opt = document.createElement("option");
            opt.value = doc.data().kwStr;
            opt.id = doc.data().id;
            palavras.appendChild(opt);
        });
    });

    return palavras;
}
function InserirPalavra(){
    var kwId;
    var kwStr;
    //função para pegar id e nome do datalist autocomplete fdp
    const idKwStr = GetIdKw();
    kwId = idKwStr.split(";")[0];
    kwStr = idKwStr.split(";")[1];

    if (kwId === "novaPalavra"){
        kwId = uuidv4();
    }
    //pegar as hashtags
    const hts = document.getElementById("hashtags").value;

    //onde(tit ou cont),idioma, max pubs
    var onde = document.querySelector('input[name="tipoPesq"]:checked').id;
    var idioma = document.getElementById("idioma");
    var selectedIdioma = idioma.options[idioma.selectedIndex].value;
    var numPub = document.getElementById("maxRes");
    var selectedNumPub = numPub.options[numPub.selectedIndex].id;

    //gerar aleatória para disparar onWrite no banco
    var uuid = uuidv4();

    //só palavras chave para dropdown
    let db = firebase.firestore();
    //para lista de palavras
    db.collection("keywords").doc(kwId).set({
        id: kwId,
        kwStr: kwStr
    })
        .then(function() {
            console.log("Palavra inserida no banco de palavras chave!");
        })
        .catch(function(error) {
            console.error("Ocorreu um erro: ", error);
        });
    //para functions "ouvir" a palavra e disparar os processos
    db.collection("funclistener").doc("palavra").set({
        id: "palavra",
        kwStr: kwStr,
        hashtags: hts,
        onde: onde,
        idioma: selectedIdioma,
        numPub: selectedNumPub,
        uuid: uuid
    })
        .then(function() {
            console.log("Palavra inserida no banco para disparo de mensagens!");
            var res = document.getElementById("resultado");
            res.innerText = "O disparo de notícias irá começar em breve."
            setTimeout(ClearResult, 4000);
        })
        .catch(function(error) {
            console.error("Ocorreu um erro: ", error);
        });
}

//funções geréricas
function GetIdKw() {
    var kw_input = document.getElementById('palavras');
    var kw_datalist = document.getElementById('palavrachave');
    var opSelected = kw_datalist.querySelector(`[value="${kw_input.value}"]`);
    var id;
    var kw;
    if (opSelected === null){
        id = "novaPalavra";
        kw = kw_input.value
    }else{
        id = opSelected.getAttribute('id');
        kw = opSelected.getAttribute('value');
    }
    return `${id};${kw}`;
}
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
function ClearResult(){
    var result = document.getElementById("resultado");
    result.innerText = "";
}
