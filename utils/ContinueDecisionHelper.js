const { sendIntroCard } = require('../utils/introCard')

async function GetOutFlow(context, commandCurrent, decisionUserCommand, optionSelectedAccessor) {

    // Verificações dos argumentos obrigatórios
    if (!context) throw new Error("O argumento 'context' é obrigatório.");
    if (!commandCurrent) throw new Error("O argumento 'commandCurrent' é obrigatório.");
    if (!decisionUserCommand) throw new Error("O argumento 'decisionUserCommand' é obrigatório.");
    if (!optionSelectedAccessor) throw new Error("O argumento 'optionSelectedAccessor' é obrigatório.");
    
    const actionCommandUserSelected = await commandCurrent.get(context, null)
    
    if (actionCommandUserSelected) {
        await context.sendActivity(`Finalizando iteração com a função ${actionCommandUserSelected}`);
        await commandCurrent.set(context, null);
        await decisionUserCommand.set(context, null);
        await optionSelectedAccessor.set(context, false)

        await sendIntroCard(context);
    } 
}

module.exports = {
    GetOutFlow
}