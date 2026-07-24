// app/api/generation+api.ts
import { POST as handleKrea2 } from './krea2+api';
import { POST as handleFluxEdit } from './flux_edit+api';
import { POST as handleIdeogram4 } from './ideogram4+api';

export async function POST(request: Request) {
    try {
        const clone = request.clone();
        const body = await clone.json();
        const model = (body.model || 'krea2').toLowerCase().trim();

        if (model === 'flux-edit' || model === 'flux_edit' || model === 'flux') {
            return await handleFluxEdit(request);
        } else if (model === 'ideogram4' || model === 'ideogram') {
            return await handleIdeogram4(request);
        } else {
            return await handleKrea2(request);
        }
    } catch (error: any) {
        console.error("Generation dispatcher error:", error);
        return Response.json({ success: false, error: error.message || 'Routing error' }, { status: 500 });
    }
}