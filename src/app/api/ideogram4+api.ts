// app/api/ideogram4+api.ts
import ideogram4Template from './ideogram4.json';

const COMFYUI_URL = 'http://127.0.0.1:8188';
const PUBLIC_COMFY_URL = 'http://192.168.31.78:8188';

export function normalizeAspectRatio(input: any): string {
    if (typeof input !== 'string') return '1:1';
    const trimmed = input.trim();
    if (/^\d+:\d+$/.test(trimmed)) {
        return trimmed;
    }
    return '1:1';
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const userPrompt = body.prompt;
        const userAspectRatio = body.aspectRatio;
        const userQuality = body.quality;
        const canvasRegions = body.canvasRegions || [];
        let finalPrompt = userPrompt || '';

        const workflow = JSON.parse(JSON.stringify(ideogram4Template));

        // 1. Inject prompt and dynamic elements_data into Node "185" (Ideogram4PromptBuilderKJ)
        if (workflow["185"]) {
            workflow["185"].inputs.high_level_description = finalPrompt;

            if (Array.isArray(canvasRegions) && canvasRegions.length > 0) {
                const elements = canvasRegions.map((region: any) => ({
                    x: Math.max(0, Math.min(1, (region.x || 0) / 100)),
                    y: Math.max(0, Math.min(1, (region.y || 0) / 100)),
                    w: Math.max(0.01, Math.min(1, (region.width || 20) / 100)),
                    h: Math.max(0.01, Math.min(1, (region.height || 20) / 100)),
                    type: "obj",
                    text: "",
                    desc: region.prompt?.trim() || "",
                    palette: []
                }));
                workflow["185"].inputs.elements_data = JSON.stringify(elements);
            } else {
                workflow["185"].inputs.elements_data = "[]";
            }
        }

        // 2. Aspect Ratio & Quality on Node "191"
        if (workflow["191"]) {
            const ratio = normalizeAspectRatio(userAspectRatio);
            workflow["191"].inputs.custom_ratio = true;
            workflow["191"].inputs.custom_aspect_ratio = ratio;

            if (userQuality === 'Fast') workflow["191"].inputs.megapixel = "0.5";
            else if (userQuality === 'Max' || userQuality === 'Quality') workflow["191"].inputs.megapixel = "1.5";
            else workflow["191"].inputs.megapixel = "1.0";
        }

        // 3. Seed on Node "197"
        if (workflow["197"]) {
            workflow["197"].inputs.seed = Math.floor(Math.random() * 1000000000000);
        }

        // 4. Remove preview/graph nodes (189: SigmasPreview, 199: PreviewAny) so ComfyUI doesn't render or return them
        delete workflow["189"];
        delete workflow["199"];

        // Queue prompt in ComfyUI
        const queueResponse = await fetch(`${COMFYUI_URL}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: workflow, client_id: "expo-api-ideogram4" })
        });

        if (!queueResponse.ok) {
            const errorText = await queueResponse.text();
            console.error("ComfyUI prompt error:", errorText);
            let detailedMsg = queueResponse.statusText;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.error?.message) detailedMsg = errorJson.error.message;
                if (errorJson.node_errors && Object.keys(errorJson.node_errors).length > 0) {
                    const nodeErrStr = Object.entries(errorJson.node_errors)
                        .map(([nodeId, errObj]: [string, any]) => {
                            const errMsgs = errObj.errors?.map((e: any) => e.details || e.message).join(', ');
                            return `Node ${nodeId} (${errObj.class_type}): ${errMsgs}`;
                        })
                        .join('; ');
                    detailedMsg += `: ${nodeErrStr}`;
                }
            } catch {
                detailedMsg += `: ${errorText}`;
            }
            throw new Error(`Failed to queue prompt in ComfyUI: ${detailedMsg}`);
        }

        const queueData = await queueResponse.json();
        const promptId = queueData.prompt_id;

        // Poll history
        let historyData: any = null;
        while (!historyData) {
            await new Promise(r => setTimeout(r, 1500));
            const historyRes = await fetch(`${COMFYUI_URL}/history/${promptId}`);
            const historyJson = await historyRes.json();
            if (historyJson[promptId]) historyData = historyJson[promptId];
        }

        // Extract output image (strictly from SaveImage node "200", ignoring any preview nodes)
        let imageData: any = null;

        if (historyData.outputs["200"]?.images?.length > 0) {
            imageData = historyData.outputs["200"].images[0];
        } else if (historyData.outputs) {
            for (const nodeId of Object.keys(historyData.outputs)) {
                const classType = (workflow[nodeId]?.class_type || '').toLowerCase();
                const title = (workflow[nodeId]?._meta?.title || '').toLowerCase();
                if (nodeId === '189' || classType.includes('sigmas') || classType.includes('preview') || title.includes('sigmas') || title.includes('preview')) {
                    continue;
                }
                const images = historyData.outputs[nodeId]?.images;
                if (images && images.length > 0) {
                    const validImg = images.find((img: any) => {
                        const fn = (img.filename || '').toLowerCase();
                        return !fn.includes('sigma') && !fn.includes('preview');
                    });
                    if (validImg) {
                        imageData = validImg;
                        break;
                    }
                }
            }
        }

        if (!imageData) throw new Error('No valid generated image returned from SaveImage node');

        const subfolder = imageData.subfolder || "";
        const imageUrl = `${PUBLIC_COMFY_URL}/view?filename=${imageData.filename}&subfolder=${subfolder}&type=${imageData.type}`;

        return Response.json({ success: true, imageUrl });
    } catch (error: any) {
        console.error("Ideogram4 API Route failed:", error);
        return Response.json({ success: false, error: error.message || 'Failed to generate image' }, { status: 500 });
    }
}
