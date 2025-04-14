const CommandHandler = require('./CommandHandler');
const { GetOutFlow }  = require('../utils/ContinueDecisionHelper')
const { generateCardDoc } = require('../utils/introCard')
const xml2js = require('xml2js');

class DocumentHandler extends CommandHandler {
    constructor(opcaoEscolhidaAccessor, comandoAtualAccessor, decisionUserCommand, documentId) {
        super()
        this.opcaoEscolhidaAccessor = opcaoEscolhidaAccessor;
        this.comandoAtualAccessor = comandoAtualAccessor;
        this.decisionUserCommand = decisionUserCommand;
        this.documentId = documentId
    }

    async handle(context) {

        const opcao = await this.opcaoEscolhidaAccessor.get(context, false)
        const estadoDecision = await this.decisionUserCommand.get(context, null)
        const texto = context.activity.text.trim();

        if(!opcao) {
            await context.sendActivity('Qual documento você está procurando, digite o seu identificador ou o nome do documento?');
            this.opcaoEscolhidaAccessor.set(context, true)
            this.decisionUserCommand.set(context, 'response')
            return;
        }

        if(estadoDecision == 'response') {
            if (texto.toLowerCase() !== 'sair'){
                const respostaIA = await this.datasetSearchDoc(texto);
                await this.ProcessResponseDocument(context, respostaIA)
                await context.sendActivity('Escolha um documento pelo ID ou diga "sair" para terminar.');
                await this.decisionUserCommand.set(context, 'awaitingDocId')
            } else {
                await GetOutFlow(context, this.comandoAtualAccessor, this.decisionUserCommand, this.opcaoEscolhidaAccessor)
                return;
            }
        }

        if (estadoDecision === 'awaitingDocId') {
            if (texto.toLowerCase() !== 'sair') {
                await this.documentId.set(context, texto);
                const docData = await this.getDocumentById(texto);

                if (!Array.isArray(docData)) {
                    await context.sendActivity(`⚠️ Resposta inesperada: ${JSON.stringify(docData)}`);
                    return;
                }

                for (const doc of docData) {
                    if (doc.tipo === 'erro') {
                        await context.sendActivity(`❌ Erro ao buscar o documento: ${doc.mensagem}`);
                    } else if (doc.tipo === 'binfile') {
                        const anexo = {
                            name: doc.nome,
                            contentType: 'application/pdf',
                            contentUrl: `data:application/pdf;base64,${doc.binario}`,
                        };

                        await context.sendActivity({
                            type: 'message',
                            text: `📎 Documento: ${doc.nome}`,
                            attachments: [anexo],
                        });
                    }
                }

                await GetOutFlow(context, this.comandoAtualAccessor, this.decisionUserCommand, this.opcaoEscolhidaAccessor);
            } else {
                await GetOutFlow(context, this.comandoAtualAccessor, this.decisionUserCommand, this.opcaoEscolhidaAccessor);
            }
        }
        
    }

    async datasetSearchDoc(pergunta)  {
        const url = 'https://isc.softexpert.com/apigateway/v1/dataset-integration/consultaDocumento';
        
        const body = {
            "contain": pergunta
        };

        const headers = {
            'Authorization': "eyJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MjcxOTc5MjQsImV4cCI6MTg4NDk2NDMyNCwiaWRsb2dpbiI6Im1hdGV1cy5saW5oYXJlcyIsInJhdGVsaW1pdCI6MTIwLCJxdW90YWxpbWl0IjoxMDAwMDB9.qQnGu_PR-B35a_qMFlMvw_0_NiSRkSNP3kegvMnyO7c",
            'Content-Type': "application/json"
        };
        
        try {
            const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
            });
            
           
            if (!response.ok) {
                throw new Error(`Erro em consultar a base: ${response.status}`);
            }
           
            const json = await response.json();
            return json || 'Ocorreu algum erro no retorno da api';
        } catch (error) {
            console.error('Erro ao consultar:', error);
            return 'Desculpe, houve um erro ao retornar os dados';
        }
    }

    async ProcessResponseDocument(context, response_api) {
        if (!Array.isArray(response_api) || response_api.length === 0) {
            await context.sendActivity("Nenhum documento encontrado.");
            return;
        }
    
        await generateCardDoc(context, response_api);
    }

    async getDocumentById(idDoc) {
        if (!idDoc) { 
            return; 
        };

        console.log('texto: ', idDoc)
        const url = 'https://isc.softexpert.com/apigateway/se/ws/dc_ws.php';
        
        const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:document">
        <soapenv:Header/>
        <soapenv:Body>
            <urn:downloadEletronicFile>
                <!--You may enter the following 8 items in any order-->
                <urn:iddocument>${idDoc}</urn:iddocument>
                <urn:fgconverttopdf>1</urn:fgconverttopdf>
            </urn:downloadEletronicFile>
        </soapenv:Body>
        </soapenv:Envelope>`;

        const headers = {
            'Authorization': "eyJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MjcxOTc5MjQsImV4cCI6MTg4NDk2NDMyNCwiaWRsb2dpbiI6Im1hdGV1cy5saW5oYXJlcyIsInJhdGVsaW1pdCI6MTIwLCJxdW90YWxpbWl0IjoxMDAwMDB9.qQnGu_PR-B35a_qMFlMvw_0_NiSRkSNP3kegvMnyO7c",
            'Content-Type': "text/xml; charset=utf-8",
            'SOAPAction': "urn:document#downloadEletronicFile"
        };
        
        try {
            const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: xml
            });
            
            if (!response.ok) {
                throw new Error(`Erro em consultar a base: ${response.status}`);
            }
           
            const xmlResponse = await response.text();
            const parserJson = await this.extractImageParser(xmlResponse)
            return parserJson || 'Ocorreu algum erro no retorno da api';
        } catch (error) {
            console.error('Erro ao consultar:', error);
            return 'Desculpe, houve um erro ao retornar os dados';
        }
    }

    async extractImageParser(xmlString) {
        const parser = new xml2js.Parser({ explicitArray: false });
    
        try {
            const result = await parser.parseStringPromise(xmlString);
            const resposta = result['SOAP-ENV:Envelope']['SOAP-ENV:Body']
                .downloadEletronicFileResponse.return;
    
            let itens = resposta.item;
    
            if (!Array.isArray(itens)) {
                itens = [itens];
            }
    
            const arquivos = itens.map(item => {
                if (item.ERROR) {
                    return { tipo: 'erro', mensagem: item.ERROR.replace(/^0:\s*/, '').trim() };
                }
    
                return {
                    tipo: 'binfile',
                    nome: item.NMFILE || 'documento.pdf',
                    binario: item.BINFILE
                };
            });
    
            return arquivos;
        } catch (err) {
            console.error('Erro ao processar XML:', err);
            return [{ tipo: 'falha', mensagem: 'Erro ao interpretar o XML' }];
        }
    }
    
}

module.exports = DocumentHandler;
