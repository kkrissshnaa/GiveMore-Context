// app/api/ideogram4+api.ts
import ideogram4Template from './ideogram4.json';

const COMFYUI_URL = 'http://127.0.0.1:8188';
const PUBLIC_COMFY_URL = 'http://192.168.31.78:8188';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const userPrompt = body.prompt;
        const userAspectRatio = body.aspectRatio;
        const userQuality = body.quality;
        const canvasRegions = body.canvasRegions || [];
        let finalPrompt = userPrompt;

        if (Array.isArray(canvasRegions) && canvasRegions.length > 0) {
            const layoutDescriptions = canvasRegions.map((region: any, i: number) => {
                const centerX = region.x + region.width / 2;
                const centerY = region.y + region.height / 2;
                const hPos = centerX < 35 ? 'left' : centerX > 65 ? 'right' : 'center';
                const vPos = centerY < 35 ? 'top' : centerY > 65 ? 'bottom' : 'middle';
                const desc = region.prompt?.trim() || `object ${i + 1}`;
                return `[Object ${i + 1}: "${desc}" placed at ${vPos}-${hPos} section, size: ${Math.round(region.width)}%x${Math.round(region.height)}% (pos: x=${Math.round(region.x)}%, y=${Math.round(region.y)}%)]`;
            }).join('; ');

            finalPrompt = `${userPrompt}. Spatial Layout & Reference Objects: ${layoutDescriptions}`;
        }

        const workflow = JSON.parse(JSON.stringify(ideogram4Template));

        // 1. Inject prompt into Node "185" (high_level_description)
        if (workflow["185"]) {
            workflow["185"].inputs.high_level_description = finalPrompt;
        }

        // 2. Aspect Ratio & Quality on Node "191"
        if (workflow["191"]) {
            const aspectMap: Record<string, string> = {
                '1:1': '1:1 (Square)',
                '4:5': '4:5 (Portrait)',
                '16:9': '16:9 (Widescreen)',
                '9:16': '9:16 (Portrait Widescreen)',
            };
            workflow["191"].inputs.aspect_ratio = aspectMap[userAspectRatio] || userAspectRatio || '1:1 (Square)';

            if (userQuality === 'Fast') workflow["191"].inputs.megapixel = "0.5";
            else if (userQuality === 'Max' || userQuality === 'Quality') workflow["191"].inputs.megapixel = "1.5";
            else workflow["191"].inputs.megapixel = "1.0";
        }

        // 3. Seed on Node "197"
        if (workflow["197"]) {
            workflow["197"].inputs.seed = Math.floor(Math.random() * 1000000000000);
        }

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
            } catch (e) {
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

        // Extract output image (strictly ignore SigmasPreview node, use SaveImage node)
        let imageData: any = null;

        // 1. Explicitly check SaveImage node "200" or any SaveImage class_type
        if (historyData.outputs["200"]?.images?.length > 0) {
            imageData = historyData.outputs["200"].images[0];
        } else {
            for (const nodeId of Object.keys(historyData.outputs)) {
                const classType = (workflow[nodeId]?.class_type || '').toLowerCase();
                const title = (workflow[nodeId]?._meta?.title || '').toLowerCase();
                if (classType.includes('sigmas') || classType.includes('preview') || title.includes('sigmas') || title.includes('preview')) {
                    continue;
                }
                const images = historyData.outputs[nodeId]?.images;
                if (images && images.length > 0) {
                    imageData = images[0];
                    break;
                }
            }
        }

        if (!imageData) throw new Error('No output image returned from ComfyUI');

        const subfolder = imageData.subfolder || "";
        const imageUrl = `${PUBLIC_COMFY_URL}/view?filename=${imageData.filename}&subfolder=${subfolder}&type=${imageData.type}`;

        return Response.json({ success: true, imageUrl });
    } catch (error: any) {
        console.error("Ideogram4 API Route failed:", error);
        return Response.json({ success: false, error: error.message || 'Failed to generate image' }, { status: 500 });
    }
}
