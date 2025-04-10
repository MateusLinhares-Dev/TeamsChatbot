const CommandHandler = require('./CommandHandler');
const axios = require('axios');
require('dotenv').config();

class SearchWorkflowHandler extends CommandHandler {
    async handle(context) {
        // console.log(context)
        let idprocess = context.activity.text.trim();
        console.log(idprocess)
        if (idprocess === "searchWorkflow" || idprocess.toLowerCase() === "sim"){ 
            await context.sendActivity('Digite o identificador do workflow que você deseja consutar: ');
            return;
        }else if (idprocess.toLowerCase() === "nao" || idprocess.toLowerCase() === "não") {
            context.sendActivity("Xablau 🥲")
            return;
        }
        
        const url = process.env.API_URL;
        const token = process.env.API_TOKEN;

        try {
            const response = await axios.post(url, { idprocess: idprocess }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                }
            });

            const data = response.data;

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
            idprocess = null;
            await context.sendActivity("Você deseja consultar outro workflow? (sim | não)");



        } catch (error) {
            console.error('Erro ao consultar o workflow:', error.message);
            await context.sendActivity('Erro ao buscar o workflow. Verifique o identificador ou tente novamente mais tarde.');
        }
    }
}

module.exports = SearchWorkflowHandler;
