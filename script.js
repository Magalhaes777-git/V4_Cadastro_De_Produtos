class Produto {
    constructor(nome, preco, quantidade) {
        this.nome = nome;
        this.preco = parseFloat(preco);
        this.quantidade = parseInt(quantidade, 10);
    }

    calcularSubtotal() {
        return this.preco * this.quantidade;
    }
}


// Lista de produtos
const listaDeProdutos = [];


// Chave usada para salvar os dados
const CHAVE_STORAGE = "sistema_estoque_produtos";


// Controla o modo de edição
// null = cadastro
// número = índice do produto em edição
let indiceEdicao = null;


// Elementos do HTML
const formProduto = document.getElementById("produto-form");
const btnLimparTudo = document.getElementById("limpar-tabela");
const totalEstoqueEl = document.getElementById("total-estoque");
const btnSalvar = document.querySelector(".btn-primary");
const campoNomeEl = document.getElementById("nome");
const sugestoesEl = document.getElementById("sugestoes");


// Salvar produtos no LocalStorage
function salvarNoLocalStorage() {
    const listaEmTexto = JSON.stringify(listaDeProdutos);

    localStorage.setItem(CHAVE_STORAGE, listaEmTexto);
}


// Carregar produtos salvos
function carregarDoLocalStorage() {
    const dadosSalvos = localStorage.getItem(CHAVE_STORAGE);

    if (dadosSalvos) {
        try {
            const produtosObjetos = JSON.parse(dadosSalvos);

            if (!Array.isArray(produtosObjetos)) {
                throw new Error("Formato de dados inválido.");
            }

            produtosObjetos.forEach((prod) => {
                const produtoInstanciado = new Produto(
                    prod.nome,
                    prod.preco,
                    prod.quantidade
                );

                listaDeProdutos.push(produtoInstanciado);
            });
        } catch (erro) {
            console.error("Erro ao carregar os produtos:", erro);
            alert("Não foi possível carregar os produtos salvos.");
        }
    }
}


// Cadastro e edição de produtos
formProduto.addEventListener("submit", function (event) {
    event.preventDefault();

    // Captura os dados do formulário
    const nome = document.getElementById("nome").value.trim();

    const preco = Number(
        document.getElementById("preco").value
    );

    const quantidade = Number(
        document.getElementById("quantidade").value
    );


    // Validação do nome
    if (!nome) {
        alert("Por favor, informe um nome válido para o produto.");
        return;
    }


    // Validação do preço
    if (!Number.isFinite(preco) || preco <= 0) {
        alert("O preço deve ser um número maior que zero.");
        return;
    }


    // Validação da quantidade
    if (
        !Number.isInteger(quantidade) ||
        quantidade <= 0
    ) {
        alert("A quantidade deve ser um número inteiro maior que zero.");
        return;
    }


    // Cria o produto após validar os dados
    const novoProduto = new Produto(
        nome,
        preco,
        quantidade
    );


    // Verifica se está cadastrando ou editando
    if (indiceEdicao === null) {
        // CREATE: adiciona um novo produto
        listaDeProdutos.push(novoProduto);

        alert("Produto cadastrado com sucesso!");
    } else {
        // UPDATE: substitui o produto existente
        listaDeProdutos[indiceEdicao] = novoProduto;

        alert("Produto atualizado com sucesso!");
    }


    // Salva os dados
    salvarNoLocalStorage();


    // Restaura o modo cadastro
    indiceEdicao = null;
    btnSalvar.textContent = "Adicionar Produto";


    // Limpa o formulário e atualiza a tela
    formProduto.reset();
    sugestoesEl.classList.remove("ativo");
    atualizarInterface();
});


// Preparar produto para edição
function prepararEdicao(index) {
    const produto = listaDeProdutos[index];

    if (!produto) {
        return;
    }


    // Preenche os campos com os dados do produto
    document.getElementById("nome").value = produto.nome;
    document.getElementById("preco").value = produto.preco;
    document.getElementById("quantidade").value = produto.quantidade;


    // Ativa o modo edição
    indiceEdicao = index;

    btnSalvar.textContent = "Salvar Alterações";

    sugestoesEl.classList.remove("ativo");
    atualizarInterface();


    // Leva o formulário até a área visível
    formProduto.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// Remover um produto
function removerProduto(index) {
    const produto = listaDeProdutos[index];

    if (!produto) {
        return;
    }

    if (!confirm(`Deseja remover o produto "${produto.nome}"?`)) {
        return;
    }


    // Remove o produto da lista
    listaDeProdutos.splice(index, 1);


    // Cancela a edição se o produto removido estava sendo editado
    if (indiceEdicao === index) {
        indiceEdicao = null;
        formProduto.reset();
        btnSalvar.textContent = "Adicionar Produto";
    } else if (indiceEdicao !== null && indiceEdicao > index) {
        // Ajusta o índice se um item anterior foi removido
        indiceEdicao--;
    }


    // Salva e atualiza
    salvarNoLocalStorage();
    atualizarInterface();
}


// Limpar todos os produtos
btnLimparTudo.addEventListener("click", function () {
    if (listaDeProdutos.length === 0) {
        alert("A tabela já está vazia!");
        return;
    }

    if (confirm("Tem certeza que deseja remover todos os produtos?")) {
        listaDeProdutos.length = 0;

        localStorage.removeItem(CHAVE_STORAGE);

        indiceEdicao = null;
        formProduto.reset();
        btnSalvar.textContent = "Adicionar Produto";

        atualizarInterface();

        alert("Todos os produtos foram removidos!");
    }
});


// Filtrar produtos pelo termo digitado (a lista original não é alterada)
function obterProdutosFiltrados() {
    // Durante a edição a tabela completa é mantida
    if (indiceEdicao !== null) {
        return listaDeProdutos.slice();
    }

    const termo = campoNomeEl.value.trim().toLowerCase();

    return listaDeProdutos.filter((produto) => {
        return produto.nome.toLowerCase().includes(termo);
    });
}


// Calcular o valor total do estoque (somente itens visíveis)
function atualizarTotalEstoque() {
    const total = obterProdutosFiltrados().reduce((acc, produto) => {
        return acc + produto.calcularSubtotal();
    }, 0);

    totalEstoqueEl.textContent =
        `Total em estoque: ${total.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })}`;
}


// Renderizar a tabela de produtos
function renderizarTabela() {
    const tabelaBody = document.querySelector(
        "#tabela-produtos tbody"
    );

    tabelaBody.innerHTML = "";


    const produtosVisiveis = obterProdutosFiltrados();

    // Mensagem quando não há itens para exibir
    if (produtosVisiveis.length === 0) {
        const linhaVazia = document.createElement("tr");
        const celulaVazia = document.createElement("td");

        celulaVazia.colSpan = 5;
        celulaVazia.classList.add("mensagem-vazia");
        celulaVazia.textContent = listaDeProdutos.length === 0
            ? "Nenhum produto cadastrado."
            : "Produto não localizado.";

        linhaVazia.appendChild(celulaVazia);
        tabelaBody.appendChild(linhaVazia);
        return;
    }


    produtosVisiveis.forEach((produto) => {
        // Índice real na lista original (necessário para editar/remover)
        const index = listaDeProdutos.indexOf(produto);

        const linha = document.createElement("tr");


        // Cria as células com segurança usando textContent
        const celulaNome = document.createElement("td");
        celulaNome.textContent = produto.nome;

        const celulaPreco = document.createElement("td");
        celulaPreco.textContent = produto.preco.toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );

        const celulaQuantidade = document.createElement("td");
        celulaQuantidade.textContent = produto.quantidade;

        const celulaSubtotal = document.createElement("td");
        celulaSubtotal.textContent = produto.calcularSubtotal()
            .toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            });


        // Coluna de ações
        const celulaAcoes = document.createElement("td");


        // Botão Editar
        const btnEditar = document.createElement("button");

        btnEditar.type = "button";
        btnEditar.textContent = "Editar";
        btnEditar.classList.add("btn-editar");

        btnEditar.addEventListener("click", function () {
            prepararEdicao(index);
        });


        // Botão Remover
        const btnRemover = document.createElement("button");

        btnRemover.type = "button";
        btnRemover.textContent = "Remover";
        btnRemover.classList.add("btn-remover");

        btnRemover.addEventListener("click", function () {
            removerProduto(index);
        });


        // Adiciona os botões à célula
        celulaAcoes.appendChild(btnEditar);
        celulaAcoes.appendChild(btnRemover);


        // Adiciona todas as células à linha
        linha.appendChild(celulaNome);
        linha.appendChild(celulaPreco);
        linha.appendChild(celulaQuantidade);
        linha.appendChild(celulaSubtotal);
        linha.appendChild(celulaAcoes);


        // Adiciona a linha à tabela
        tabelaBody.appendChild(linha);
    });
}


// Atualizar toda a interface
function atualizarInterface() {
    renderizarTabela();
    atualizarTotalEstoque();
}


// Exibe sugestões de produtos já cadastrados com base no que foi digitado
function atualizarSugestoes() {
    sugestoesEl.innerHTML = "";

    const termo = campoNomeEl.value.trim();

    if (!termo || indiceEdicao !== null) {
        sugestoesEl.classList.remove("ativo");
        return;
    }

    // Nomes únicos, no máximo 5 sugestões
    const nomes = [...new Set(
        obterProdutosFiltrados().map((produto) => produto.nome)
    )].slice(0, 5);

    if (nomes.length === 0) {
        sugestoesEl.classList.remove("ativo");
        return;
    }

    nomes.forEach((nome) => {
        const item = document.createElement("li");
        item.textContent = nome;

        // mousedown evita que o input perca o foco antes do clique
        item.addEventListener("mousedown", function (event) {
            event.preventDefault();
            campoNomeEl.value = nome;
            sugestoesEl.classList.remove("ativo");
            atualizarInterface();
        });

        sugestoesEl.appendChild(item);
    });

    sugestoesEl.classList.add("ativo");
}


// Digitação em tempo real no campo Nome: sugestões + tabela + total
campoNomeEl.addEventListener("input", function () {
    atualizarSugestoes();
    atualizarInterface();
});

// Fecha as sugestões ao sair do campo ou pressionar Esc
campoNomeEl.addEventListener("blur", function () {
    sugestoesEl.classList.remove("ativo");
});

campoNomeEl.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        sugestoesEl.classList.remove("ativo");
    }
});


// Inicialização do sistema
carregarDoLocalStorage();
atualizarInterface();