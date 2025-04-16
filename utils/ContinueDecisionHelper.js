const { sendIntroCard } = require('../utils/introCard')

async function GetOutFlow(context, commandCurrent, decisionUserCommand, optionSelectedAccessor) {

    if (!context) throw new Error("O argumento 'context' é obrigatório.");
    if (!commandCurrent) throw new Error("O argumento 'commandCurrent' é obrigatório.");
    if (!decisionUserCommand) throw new Error("O argumento 'decisionUserCommand' é obrigatório.");
    if (!optionSelectedAccessor) throw new Error("O argumento 'optionSelectedAccessor' é obrigatório.");
    
    const actionCommandUserSelected = await commandCurrent.get(context, null)
    console.log(await actionCommandUserSelected)
    if (actionCommandUserSelected) {
        await context.sendActivity(`Finalizando iteração com a função ${actionCommandUserSelected}`);
        await commandCurrent.set(context, undefined);
        await decisionUserCommand.set(context, undefined);
        await optionSelectedAccessor.set(context, undefined)
        console.log("log opcao deletado" , await optionSelectedAccessor.get(context, false))

        await sendIntroCard(context);
    } 
}

module.exports = {
    GetOutFlow
}