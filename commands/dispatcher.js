const SofiaHandler = require('./SofiaHandler');
const InstanceWorkflowHandler = require('./InstanceWorkflowHandler');
const SearchWorkflowHandler = require('./SearchWorkflowHandler');
const DocumentHandler = require('./DocumentHandler');

class CommandDispatcher {
    constructor(accessors) {
        this.accessors = accessors;

        this.handlers = {
            'sofia': () => new SofiaHandler(this.accessors.option, this.accessors.commandNew, this.accessors.decision),
            'InstanceWorkflow': () => new InstanceWorkflowHandler(),
            'searchWorkflow': () => new SearchWorkflowHandler(),
            'document': () => new DocumentHandler(this.accessors.option, this.accessors.commandNew, this.accessors.decision, this.accessors.documentId)
        };
    }

    async dispatch(context, command) {
        const handlerFactory = this.handlers[command];
        if (handlerFactory) {
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

