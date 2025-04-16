const CommandHandler = require('./CommandHandler');
const { GetOutFlow }  = require('../utils/ContinueDecisionHelper')
const fetch = require('node-fetch');
require('dotenv').config();

class InstanceWorkflowHandler extends CommandHandler {
    constructor(optionAccessor, commandNewAccessor, decisionAccessor) {
        super();
        this.optionAccessor = optionAccessor;
        this.commandNewAccessor = commandNewAccessor;
        this.decisionAccessor = decisionAccessor;
    }

    async handle(context) {
        const data = await this.optionAccessor.get(context, {
            step: 0,
            idprocess: []
        });


        function formatDateToISO(dateString) {
            const parts = dateString.split('/');
            if (parts.length !== 3) return null;
            const [day, month, year] = parts;
            return `${year}-${month}-${day}`;
        }

        function isValidDate(dateString) {
            const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
            const match = dateString.match(regex);

            if (!match) return false;

            const day = parseInt(match[1], 10);
            const month = parseInt(match[2], 10);
            const year = parseInt(match[3], 10);

            const date = new Date(year, month, day);

            return (
                date.getFullYear() === year &&
                date.getMonth() === month &&
                date.getDate() === day
            );
        }

        const criticidadeMap = {
            '1': 'Normal',
            '2': 'Urgente',
            '3': 'Emergência'
        };

        const text = context.activity.text.trim();

        switch (data.step) {
            case 0:
                await context.sendActivity("Digite o título do chamado:");
                data.step++;
                break;

            case 1:
                data.idprocess.push(text);
                await context.sendActivity("Digite o nome do fornecedor:");
                data.step++;
                break;

            case 2:
                data.idprocess.push(text);
                await context.sendActivity("Digite a data de ocorrência (dd/mm/yyyy):");
                data.step++;
                break;

            case 3:
                if (isValidDate(text)) {
                    const dataFormatada = formatDateToISO(text);
                    data.idprocess.push(dataFormatada);
                    await context.sendActivity("Digite a criticidade:\n\n1 - Normal\n2 - Urgente\n3 - Emergência");
                    data.step++;
                } else {
                    await context.sendActivity("Data inválida. Por favor, digite no formato dd/mm/yyyy.");
                }
                break;

            case 4:
                const valorCriticidade = criticidadeMap[text];
                if (valorCriticidade) {
                    data.idprocess.push(valorCriticidade);
                    await context.sendActivity("Prazo Disposição Imediata (dd/mm/yyyy):");
                    data.step++;
                } else {
                    await context.sendActivity("Opção inválida. Por favor, digite:\n\n1 - Normal\n2 - Urgente\n3 - Emergência");
                }
                break;

            case 5:
                if (isValidDate(text)) {
                    const dataFormatada = formatDateToISO(text);
                    data.idprocess.push(dataFormatada);
                    await context.sendActivity("Digite a descrição do chamado:");
                    data.step++;
                } else {
                    await context.sendActivity("Data inválida. Por favor, digite no formato dd/mm/yyyy.");
                }
                break;
            case 6:
                data.idprocess.push(text);
                console.log("Valores inseridos:", data.idprocess);
                try {
                    const resultado = await this.sendWorkflow(data.idprocess);
                    await context.sendActivity("Chamado enviado com sucesso!");
                    console.log("Workflow enviado:", resultado);

                    data.step = -1;
                    break;
                } catch (err) {
                    await context.sendActivity("Erro ao enviar o chamado. ", err);
                    break;
                }
        }

        await this.optionAccessor.set(context, data);

        if (data.step === -1) {
            await GetOutFlow(context, this.commandNewAccessor, this.decisionAccessor, this.optionAccessor)
        }
    }

    async sendWorkflow(data) {
        const headers = {
            'Authorization': process.env.apiToken,
            'SOAPAction': 'urn:workflow#',
            'Content-Type': 'text/xml;charset=UTF-8'
        };

        const payload = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:workflow">
        <soapenv:Header/>
        <soapenv:Body>
            <urn:newWorkflowEditData>
                <urn:ProcessID>RNCS</urn:ProcessID>
                <urn:WorkflowTitle>${data[0]}</urn:WorkflowTitle>
                <urn:EntityList>
                    <urn:Entity>
                    <urn:EntityID>RAC</urn:EntityID>
                    <urn:EntityAttributeList>
                        <urn:EntityAttribute>
                            <urn:EntityAttributeID>titulo</urn:EntityAttributeID>
                            <urn:EntityAttributeValue>${data[0]}</urn:EntityAttributeValue>
                        </urn:EntityAttribute>
                        <urn:EntityAttribute>
                            <urn:EntityAttributeID>fornecedor</urn:EntityAttributeID>
                            <urn:EntityAttributeValue>${data[1]}</urn:EntityAttributeValue>
                        </urn:EntityAttribute>
                        <urn:EntityAttribute>
                            <urn:EntityAttributeID>dtocorrencia</urn:EntityAttributeID>
                            <urn:EntityAttributeValue>${data[2]}</urn:EntityAttributeValue>
                        </urn:EntityAttribute>
                        <urn:EntityAttribute>
                            <urn:EntityAttributeID>dtdisposicao</urn:EntityAttributeID>
                            <urn:EntityAttributeValue>${data[4]}</urn:EntityAttributeValue>
                        </urn:EntityAttribute>
                        <urn:EntityAttribute>
                            <urn:EntityAttributeID>descricao</urn:EntityAttributeID>
                            <urn:EntityAttributeValue>${data[5]}</urn:EntityAttributeValue>
                        </urn:EntityAttribute>
                    </urn:EntityAttributeList>
                    <urn:RelationshipList>
                        <urn:Relationship>
                            <urn:RelationshipID>relcriticidade</urn:RelationshipID>
                            <urn:RelationshipAttributeList>
                                <urn:RelationshipAttribute>
                                <urn:RelationshipAttributeID>criticidade</urn:RelationshipAttributeID>
                                <urn:RelationshipAttributeValue>${data[3]}</urn:RelationshipAttributeValue>
                                </urn:RelationshipAttribute>
                            </urn:RelationshipAttributeList>
                        </urn:Relationship>
                    </urn:RelationshipList>
                    </urn:Entity>
                </urn:EntityList>
            </urn:newWorkflowEditData>
        </soapenv:Body>
        </soapenv:Envelope>`;
    
        try {
            const response = await fetch('https://isc.softexpert.com/apigateway/se/ws/wf_ws.php', {
                method: 'POST',
                headers: headers,
                body: payload
            });
    
            const responseText = await response.text();
            return responseText;
        } catch (error) {
            console.error("Erro ao enviar o workflow:", error);
            throw error;
        }
    }
}

module.exports = InstanceWorkflowHandler;
