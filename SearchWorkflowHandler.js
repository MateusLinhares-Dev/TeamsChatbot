const CommandHandler = require('./CommandHandler');
const axios = require('axios');
require('dotenv').config();

class SearchWorkflowHandler extends CommandHandler {
    constructor(opcaoEscolhida, commandNew, decision) {
        super();
        this.opcaoEscolhida = opcaoEscolhida;
        this.commandNew = commandNew;
        this.decision = decision;
    }

    async handle(context) {
        const idprocess = context.activity.text?.trim();

        if (!/^\d+$/.test(idprocess)) {
            await context.sendActivity('Digite o número do chamado que você deseja buscar:');
            return;
        }

        await this.queryWorkflow(context, idprocess);

        // Limpa o estado de comando para encerrar o fluxo
        await this.commandNew.set(context, null);
    }

    async queryWorkflow(context, idprocess) {
        const url = process.env.API_URL;
        const token = process.env.API_TOKEN;
    
        try {
            const response = await axios.post(url, {
                idprocess: idprocess 
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                }
            });

            const data = response.data;

            if (Array.isArray(data) && data.length > 0) {
                const item = data[0];
                await context.sendActivity(
                    `🔍 Resultado da consulta:\n` +
                    `📅 Data de Início: ${item.datainicio}\n` +
                    `🧾 Processo: ${item.nomeprocesso}\n` +
                    `🎫 Ticket: ${item.ticket}\n` +
                    `📂 Tipo: ${item.tipoprocesso}\n` +
                    `👤 Iniciador: ${item.iniciador}\n` +
                    `📝 Título: ${item.titulo}\n` +
                    `📌 Status: ${item.status}`
                );
            } else {
                await context.sendActivity('Nenhuma informação encontrada para o chamado informado.');
            }
        } catch (error) {
            console.error('Erro ao consultar o dataset:', error.message);
            await context.sendActivity('Erro ao buscar o workflow. Verifique o número informado ou tente novamente mais tarde.');
        }
    }
}

module.exports = SearchWorkflowHandler;
