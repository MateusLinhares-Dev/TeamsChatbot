const CommandHandler = require('./CommandHandler');
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
            const [day, month, year] = dateString.split('/');
            return `${year}-${month}-${day}`;
        }

        function isValidDate(dateString) {
            const regex = /^\d{2}\/\d{2}\/\d{4}$/;
            const match = dateString.match(regex);

            if (!match) return false;

            const day = parseInt(match[0].split('/')[0], 10);
            const month = parseInt(match[0].split('/')[1], 10) - 1;
            const year = parseInt(match[0].split('/')[2], 10);

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
                data.idprocess.push(text); // título
                await context.sendActivity("Digite o nome do fornecedor:");
                data.step++;
                break;

            case 2:
                data.idprocess.push(text); // fornecedor
                await context.sendActivity("Digite a data de ocorrência (dd/mm/yyyy):");
                data.step++;
                break;

            case 3:
                if (isValidDate(text)) {
                    const dataFormatada = formatDateToISO(text);
                    data.idprocess.push(dataFormatada); // data de ocorrência
                    await context.sendActivity("Digite a criticidade:\n\n1 - Normal\n2 - Urgente\n3 - Emergência");
                    data.step++;
                } else {
                    await context.sendActivity("Data inválida. Por favor, digite no formato dd/mm/yyyy.");
                }
                break;

            case 4:
                const valorCriticidade = criticidadeMap[text];
                if (valorCriticidade) {
                    data.idprocess.push(valorCriticidade); // criticidade
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
                print()
            case 6:
                data.idprocess.push(text); // descrição
                console.log("Valores inseridos:", data.idprocess);
                try {
                    const resultado = await enviarWorkflow(data.idprocess);
                    await context.sendActivity("Chamado enviado com sucesso!");
                    console.log("Workflow enviado:", resultado);
                } catch (err) {
                    await context.sendActivity("Erro ao enviar o chamado.");
                }

                data.step = 0;
                data.idprocess = [];
                break;
        }
    }
}

async function enviarWorkflow(data) {
    const headers = {
        'Authorization': process.env.API_TOKEN,
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

module.exports = InstanceWorkflowHandler;