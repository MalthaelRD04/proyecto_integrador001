export const WHATSAPP_TEMPLATES = {
    AVISO_LISTO: {
        name: 'Aviso de Trabajo Listo',
        message: (t, cli) => `Hola ${cli?.nombre || 'estimado cliente'}, le informamos que su trabajo #${t.id} (${t.descripcion}) ya está listo para ser retirado en JRJ Centro de Copias. 📦\n\n💰 Total a pagar: RD$ ${t.saldo_pendiente}\n\n¡Le esperamos!`
    },
    RECORDATORIO_PAGO: {
        name: 'Recordatorio de Pago',
        message: (t, cli) => `Hola ${cli?.nombre || 'estimado cliente'}, le recordamos que tiene un saldo pendiente de RD$ ${t.saldo_pendiente} por su trabajo #${t.id}. 💳\n\nPuede pasar a cancelarlo en nuestro local. ¡Gracias!`
    },
    CONFIRMACION_RECIBIDO: {
        name: 'Confirmación de Recibido',
        message: (t, cli) => `Hola ${cli?.nombre || 'estimado cliente'}, hemos recibido su trabajo #${t.id}: ${t.descripcion}. ✅\n\n📅 Fecha estimada de entrega: ${t.fecha_entrega_estimada}\n\nLe avisaremos en cuanto esté listo.`
    },
    GENERICO: {
        name: 'Mensaje Genérico',
        message: (t, cli) => `Hola ${cli?.nombre || 'estimado cliente'}, le escribimos de JRJ Centro de Copias en relación a su trabajo #${t.id}.`
    }
};
