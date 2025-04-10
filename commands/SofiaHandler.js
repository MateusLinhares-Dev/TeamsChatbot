const CommandHandler = require('./CommandHandler');
const fetch = require('node-fetch');
const { sendQuestionCard } = require('../utils/introCard')

class SofiaHandler extends CommandHandler {
    constructor(opcaoEscolhidaAccessor, comandoAtualAccessor, decisionUserCommand) {
        super();
        this.opcaoEscolhidaAccessor = opcaoEscolhidaAccessor;
        this.comandoAtualAccessor = comandoAtualAccessor;
        this.decisionUserCommand = decisionUserCommand;
    }

    async handle(context) {
        const estadoDecision = await this.decisionUserCommand.get(context, null);
        const opcao = await this.opcaoEscolhidaAccessor.get(context, false);
        const texto = context.activity.text;

        if (!opcao) {
            await context.sendActivity('Faça uma pergunta:');
            await this.opcaoEscolhidaAccessor.set(context, true);
            await this.decisionUserCommand.set(context, 'conversando');
            return;
        }

        if (estadoDecision === 'conversando') {
            if (!await texto.toLowerCase().includes('sair')){
                const respostaIA = await this.sendForIA(texto);
                await context.sendActivity(`🧠 Sofia respondeu:\n${respostaIA}`);
                await context.sendActivity('Pode continuar a perguntar ou diga "sair" para terminar.');
            } else {
                await this.opcaoEscolhidaAccessor.set(context, false);
                await this.decisionUserCommand.set(context, null);
                await context.sendActivity('Conversa com Sofia terminada. Até à próxima!');
            }
        
        }
    }

    async sendForIA(pergunta) {
        const url = 'https://c6nntc3gy9.execute-api.us-east-1.amazonaws.com/DevBedrock';

        const body = {
            question: pergunta
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`Erro da IA: ${response.statusText}`);
            }

            const json = await response.json();
            return json.answer || 'Não entendi a resposta da IA.';
        } catch (error) {
            console.error('Erro ao consultar IA:', error);
            return 'Desculpe, houve um erro ao processar sua pergunta.';
        }
    }
}

module.exports = SofiaHandler;
