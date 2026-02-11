
import { sendMessageToGemini } from './src/services/gemini.js';
import pkg from './package.json' assert { type: 'json' };

const userMessage = 'Quiero hacer ejercicio pero no tengo ganas, tengo fiaca. estoy en el sillon, mi voz pobrecito me dice \"no lo hagas, no te hagas eso, mereces descansar\"';

async function test() {
    console.log('🤖 Consultando a Conciencia...');
    // Nota: En este entorno de test forzamos la API Key porque .env no se carga automático en node directo sin configuración
    process.env.VITE_GEMINI_API_KEY = 'AIzaSyC6jj4izZfOsDtNyD_Cv5YjrCPPo1-rqI4';

    const result = await sendMessageToGemini(userMessage);

    console.log('\n--- ANALISIS DE VOZ ---');
    console.log('Voz Detectada:', result.analisis.voz_identificada);
    console.log('Emociones:', result.analisis.estado_emocional.join(', '));
    console.log('Distorsiones:', result.analisis.distorsion_cognitiva.join(', ') || 'Ninguna');

    console.log('\n--- RESPUESTA DEL ADULTO RESPONSABLE ---');
    console.log(result.respuesta_conversacional);

    console.log('\n--- REESTRUCTURACION COGNITIVA ---');
    console.log('Pensamiento Alternativo:', result.analisis.pensamiento_alternativo);
}

test();
