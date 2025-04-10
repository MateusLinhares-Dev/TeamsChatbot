class CommandHandler {
    async handle(context) {
        throw new Error('O método handle() precisa ser implementado');
    }
}

module.exports = CommandHandler;
