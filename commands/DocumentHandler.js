const CommandHandler = require('./CommandHandler'); 

class DocumentHandler extends CommandHandler {
    constructor(opcaoEscolhidaAccessor, comandoAtualAccessor, decisionUserCommand) {
        super()
        this.opcaoEscolhidaAccessor = opcaoEscolhidaAccessor;
        this.comandoAtualAccessor = comandoAtualAccessor;
        this.decisionUserCommand = decisionUserCommand;
        
    }
    async handle(context) {
        const opcao = this.opcaoEscolhidaAccessor.get(context, false)
        const decision = this.decisionUserCommand.get(context, false)
        const texto = context.activity.text;

        if(!opcao) {
            await context.sendActivity('Qual documento você está procurando, digite o seu identificador ou o nome do documento?');
            this.opcaoEscolhidaAccessor.set(context, true)
            this.decisionUserCommand.set(context, 'response')
            return;
        }

        if(decision == 'response') {
            const respostaIA = await this.datasetSearchDoc(texto);
            await context.sendActivity(`🧠 Sofia respondeu:\n${respostaIA}`);
            await context.sendActivity('Pode continuar a perguntar ou diga "sair" para terminar.');
        }

    }

    async datasetSearchDoc(pergunta)  {
        const url = 'https://isc.softexpert.com/apigateway/v1/dataset-integration/consultaDocumento';
        
        const body = {
            contain: pergunta
        };

        const headers = {
            'Authorization': "eyJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MjcxOTc5MjQsImV4cCI6MTg4NDk2NDMyNCwiaWRsb2dpbiI6Im1hdGV1cy5saW5oYXJlcyIsInJhdGVsaW1pdCI6MTIwLCJxdW90YWxpbWl0IjoxMDAwMDB9.qQnGu_PR-B35a_qMFlMvw_0_NiSRkSNP3kegvMnyO7c",
            'Content-Type': "application/json"
        };
        
        try {
            const response = await fetch(url, {
            method: 'POST',
            header: JSON.stringify(headers),
            body: JSON.stringify(body)
            });
        
            if (!response.ok) {
                throw new Error(`Erro em consultar a base: ${response.statusText}`);
            }
        
            const json = await response.json();
            return json.answer || 'Ocorreu algum erro no retorno da api';
        } catch (error) {
            console.error('Erro ao consultar:', error);
            return 'Desculpe, houve um erro ao retornar os dados';
        }
    }
}

module.exports = DocumentHandler;
