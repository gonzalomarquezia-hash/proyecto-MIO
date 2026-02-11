const key = 'AIzaSyC6jj4izZfOsDtNyD_Cv5YjrCPPo1-rqI4'

async function test() {
    const models = ['gemini-2.5-pro', 'gemini-3-pro-preview', 'gemini-3-flash-preview']

    for (const model of models) {
        console.log(`\nTesting ${model}...`)
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: 'Decime hola en argentino. Responde solo JSON: {"msg": "..."}' }] }],
                    generationConfig: { responseMimeType: 'application/json' }
                })
            }
        )

        console.log('Status:', res.status)
        const d = await res.json()
        if (d.error) {
            console.log('ERROR:', d.error.message?.substring(0, 150))
        } else {
            console.log('OK:', d.candidates[0].content.parts[0].text)
        }
    }
}

test()
