const SofiaHandler = require('./SofiaHandler');
const InstanceWorkflowHandler = require('./InstanceWorkflowHandler');
const SearchWorkflowHandler = require('./SearchWorkflowHandler');
const DocumentHandler = require('./DocumentHandler');

class CommandDispatcher {
    constructor(accessors) {
        this.accessors = accessors;

        this.handlers = {
            'sofia': () => new SofiaHandler(this.accessors.option, this.accessors.commandNew, this.accessors.decision),
            'InstanceWorkflow': () => new InstanceWorkflowHandler(this.accessors.option, this.accessors.commandNew, this.accessors.decision),
            'searchWorkflow': () => new SearchWorkflowHandler(this.accessors.option, this.accessors.commandNew, this.accessors.decision),
            'document': () => new DocumentHandler(this.accessors.option, this.accessors.commandNew, this.accessors.decision, this.accessors.documentId)
        };
    }

    async dispatch(context, command) {
        const handlerFactory = this.handlers[command];
        if (handlerFactory) {
            console.log('PASSEI AQUI E TO EXECUTANDO A FUNÇÃO DE ORDEM SUPERIOR')
            const handler = handlerFactory();
            await handler.handle(context);
            return true;
        } else {
            await context.sendActivity(`Comando desconhecido: ${command}`);
            return false;
        }
    }
}

module.exports = CommandDispatcher;

