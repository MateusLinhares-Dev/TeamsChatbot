const CommandHandler = require('./CommandHandler');
const { GetOutFlow } = require('../utils/ContinueDecisionHelper');
const { generateCardDoc, OptionsFilesDocumentCard } = require('../utils/introCard');
const xml2js = require('xml2js');
const mime = require('mime-types');

const STATES = {
    ASKING_FOR_DOC: 'response',
    AWAITING_DOC_ID: 'awaitingDocId',
    FILES_SELECTED: 'SelectedFiles'
};

const urlApi = process.env.urlSearchDoc
const token = process.env.apiToken

class DocumentHandler extends CommandHandler {
    constructor(opcaoEscolhidaAccessor, comandoAtualAccessor, decisionUserCommand, documentId) {
        super();
        this.opcaoEscolhidaAccessor = opcaoEscolhidaAccessor;
        this.comandoAtualAccessor = comandoAtualAccessor;
        this.decisionUserCommand = decisionUserCommand;
        this.documentId = documentId;
    }

    async handle(context) {
        const opcao = await this.opcaoEscolhidaAccessor.get(context, false);
        const estado = await this.decisionUserCommand.get(context, null);
        const texto = context.activity.text ? context.activity.text.trim() : '';
        const selectedValue = context.activity.value ? context.activity.value : '';

        if (!opcao) return this.askForDocument(context);

        switch (estado) {
            case STATES.ASKING_FOR_DOC:
                return this.handleDocSearch(context, texto);
            case STATES.AWAITING_DOC_ID:
                return this.handleDocIdInput(context, texto);
            case STATES.FILES_SELECTED:
                return this.handleFilesSelection(context, opcao, selectedValue);
            default:
                return this.askForDocument(context);
        }
    }

    async askForDocument(context) {
        await context.sendActivity('Qual documento você está procurando? Digite o nome ou identificador.');
        await this.opcaoEscolhidaAccessor.set(context, true);
        await this.decisionUserCommand.set(context, STATES.ASKING_FOR_DOC);
    }

    async handleDocSearch(context, texto) {
        if (texto.toLowerCase() === 'sair') {
            await GetOutFlow(context, this.comandoAtualAccessor, this.decisionUserCommand, this.opcaoEscolhidaAccessor);
        }

        const responseDoc = await this.datasetSearchDoc(texto);
        const found = await this.processResponseDocument(context, responseDoc);

        if (found) {
            await context.sendActivity('Escolha um documento pelo ID ou digite "sair" para terminar.');
            await this.decisionUserCommand.set(context, STATES.AWAITING_DOC_ID);
        }
    }

    async handleDocIdInput(context, texto) {
        if (texto.toLowerCase() === 'sair') {
            return GetOutFlow(context, this.comandoAtualAccessor, this.decisionUserCommand, this.opcaoEscolhidaAccessor);
        }

        await this.documentId.set(context, texto);
        const docData = await this.getDocumentById(texto);

        if (!Array.isArray(docData)) {
            await context.sendActivity(`⚠️ Resposta inesperada: ${JSON.stringify(docData)}`);
            return;
        }

        const cardSend = await OptionsFilesDocumentCard(context, docData);
        if (cardSend) {
            await this.decisionUserCommand.set(context, STATES.FILES_SELECTED);
            await this.opcaoEscolhidaAccessor.set(context, docData);
        }
    }

    async handleFilesSelection(context, docData, selectedValue) {
        if (!selectedValue) return;

        const selectValueClean = selectedValue.selectedFiles
            .split(',')
            .map(file => file.trim());

        const filterFiles = docData.filter(data => selectValueClean.includes(data.nome));

        for (const doc of filterFiles) {
            if (doc.tipo === 'erro') {
                await context.sendActivity(`❌ Erro ao buscar o documento: ${doc.mensagem}`);
                await context.sendActivity(`Escolha outro documento que realmente exista`);
            } else if (doc.tipo === 'binfile') {
                
                const anexo = {
                    name: doc.nome,
                    contentType: mime.lookup(doc.nome) || 'application/octet-stream',
                    contentUrl: `https://meuservidor.com/download/${encodeURIComponent(doc.nome)}`
                };
                
                await context.sendActivity({
                    type: 'message',
                    text: `📎 Documento: ${doc.nome}`,
                    attachments: [anexo],
                });
            }
        }

        await GetOutFlow(context, this.comandoAtualAccessor, this.decisionUserCommand, this.opcaoEscolhidaAccessor);
    }

    async datasetSearchDoc(pergunta) {
        const url = urlApi
        const headers = {
            'Authorization': token,
            'Content-Type': "application/json"
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ contain: pergunta })
            });

            if (!response.ok) throw new Error(`Erro em consultar a base: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Erro ao consultar:', error);
            return [];
        }
    }

    async processResponseDocument(context, response_api) {
        if (!Array.isArray(response_api) || response_api.length === 0) {
            await context.sendActivity('Nenhum documento encontrado. Tente novamente ou digite "sair" do fluxo.');
            return false;
        }

        await generateCardDoc(context, response_api);
        return true;
    }

    async getDocumentById(idDoc) {
        const url = 'https://isc.softexpert.com/apigateway/se/ws/dc_ws.php';
        const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:document">
            <soapenv:Header/>
            <soapenv:Body>
                <urn:downloadEletronicFile>
                    <urn:iddocument>${idDoc}</urn:iddocument>
                    <urn:fgconverttopdf>1</urn:fgconverttopdf>
                </urn:downloadEletronicFile>
            </soapenv:Body>
        </soapenv:Envelope>`;

        const headers = {
            'Authorization': token,
            'Content-Type': "text/xml; charset=utf-8",
            'SOAPAction': "urn:document#downloadEletronicFile"
        };

        try {
            const response = await fetch(url, { method: 'POST', headers, body: xml });
            if (!response.ok) throw new Error(`Erro em consultar a base: ${response.status}`);
            const xmlResponse = await response.text();
            return await this.extractImageParser(xmlResponse);
        } catch (error) {
            console.error('Erro ao consultar:', error);
            return [{ tipo: 'erro', mensagem: 'Erro ao consultar documento' }];
        }
    }

    async extractImageParser(xmlString) {
        const parser = new xml2js.Parser({ explicitArray: false });

        try {
            const result = await parser.parseStringPromise(xmlString);
            let itens = result['SOAP-ENV:Envelope']['SOAP-ENV:Body']
                .downloadEletronicFileResponse.return.item;

            if (!Array.isArray(itens)) itens = [itens];

            return itens.map(item => item.ERROR
                ? { tipo: 'erro', mensagem: item.ERROR.replace(/^0:\s*/, '').trim() }
                : {
                    tipo: 'binfile',
                    nome: item.NMFILE || 'documento.pdf',
                    binario: item.BINFILE
                }
            );
        } catch (err) {
            console.error('Erro ao processar XML:', err);
            return [{ tipo: 'falha', mensagem: 'Erro ao interpretar o XML' }];
        }
    }
}

module.exports = DocumentHandler;
