const CommandHandler = require('./CommandHandler');
const { GetOutFlow } = require('../utils/ContinueDecisionHelper');
require('dotenv').config();

const url = process.env.apiUrlInstanceWf;
const token = process.env.apiToken;

class SearchWorkflowHandler extends CommandHandler {
    constructor(opcaoEscolhidaAccessor, comandoAtualAccessor, decisionUserCommand, documentId) {
        super();
        this.opcaoEscolhidaAccessor = opcaoEscolhidaAccessor;
        this.comandoAtualAccessor = comandoAtualAccessor;
        this.decisionUserCommand = decisionUserCommand;
        this.documentId = documentId;
    }

    async handle(context) {
        let idprocess = context.activity.text.trim();
        const opcao = await this.opcaoEscolhidaAccessor.get(context, false);

        console.log(opcao)
        console.log(idprocess)
        if (!opcao || idprocess.toLowerCase() === "sim") return this.askForWorkflow(context)

        if (idprocess.toLowerCase() === "nao" || idprocess.toLowerCase() === "não") return this.askGetoutFlow(context)

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ idprocess: idprocess })
            });

            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }

            const data = await response.json();

            if (Array.isArray(data) && data.length > 0) {
                const item = data[0];
                await context.sendActivity(
                    `🔍 Resultado da consulta:\n\n` +
                    `📅 Data de Início: ${item.datainicio}\n\n` +
                    `🧾 Processo: ${item.nomeprocesso}\n\n` +
                    `🎫 Ticket: ${item.ticket}\n\n` +
                    `📂 Tipo: ${item.tipoprocesso}\n\n` +
                    `👤 Iniciador: ${item.iniciador}\n\n` +
                    `📝 Título: ${item.titulo}\n\n` +
                    `📌 Status: ${item.status}`
                );    
            } else {
                await context.sendActivity('Nenhuma informação encontrada para o identificador informado.');
            }

            await context.sendActivity("Você deseja consultar outro workflow? (sim | não)");

        } catch (error) {
            console.error('Erro ao consultar o workflow:', error.message);
            await context.sendActivity('Erro ao buscar o workflow. Verifique o identificador ou tente novamente mais tarde.');
        }
    }

    async askForWorkflow(context) {
        await context.sendActivity('Digite o identificador do workflow que você deseja consultar: ');
        await this.opcaoEscolhidaAccessor.set(context, true)
        return;
    }

    async askGetoutFlow(context) {
        await GetOutFlow(context, this.comandoAtualAccessor, this.decisionUserCommand, this.opcaoEscolhidaAccessor);
        return;
    }
}

module.exports = SearchWorkflowHandler;