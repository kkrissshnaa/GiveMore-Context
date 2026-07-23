// app/api/generation+api.ts
import workflowTemplate from './workflow_api.json';
import fluxEditTemplate from './flux_edit.json';
import ideogram4Template from './ideogram4.json';

// The IP address of your ComfyUI machine
const COMFYUI_URL = 'http://127.0.0.1:8188';

async function uploadImageToComfy(imageSrc: string): Promise<string> {
    if (!imageSrc) return "";
    if (!imageSrc.startsWith('http') && !imageSrc.startsWith('data:') && !imageSrc.startsWith('file:') && !imageSrc.includes('/') && !imageSrc.includes('\\')) {
        return imageSrc;
    }

    try {
        let buffer: Buffer;
        const filename = `ref_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;

        if (imageSrc.startsWith('data:')) {
            const base64Data = imageSrc.split(',')[1] || imageSrc;
            buffer = Buffer.from(base64Data, 'base64');
        } else {
            const res = await fetch(imageSrc);
            const arrayBuffer = await res.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        }

        const blob = new Blob([buffer], { type: 'image/png' });
        const formData = new FormData();
        formData.append('image', blob, filename);
        formData.append('overwrite', 'true');

        const uploadRes = await fetch(`${COMFYUI_URL}/upload/image`, {
            method: 'POST',
            body: formData,
        });

        if (!uploadRes.ok) {
            console.error("Failed to upload image to ComfyUI:", await uploadRes.text());
            return filename;
        }

        const uploadData = await uploadRes.json();
        return uploadData.name || filename;
    } catch (err) {
        console.error("Error uploading image to ComfyUI:", err);
        return imageSrc;
    }
}

export async function POST(request: Request) {
    try {
        // 1. Parse the incoming request body from your frontend
        const body = await request.json();
        const userPrompt = body.prompt;
        const userAspectRatio = body.aspectRatio;
        const userQuality = body.quality;
        const userModel = (body.model || 'krea2').toLowerCase().trim();

        if (!userPrompt) {
            return Response.json(
                { success: false, error: 'Prompt is required' },
                { status: 400 }
            );
        }

        // Extract reference images (capped at 2)
        let refs: string[] = [];
        if (Array.isArray(body.referenceImages) && body.referenceImages.length > 0) {
            refs = body.referenceImages.slice(0, 2);
        } else if (body.referenceImage) {
            refs = [body.referenceImage];
        }

        let workflow: any;
        const aspectMap: Record<string, string> = {
            '1:1': '1:1 (Square)',
            '4:5': '4:5 (Portrait)',
            '16:9': '16:9 (Widescreen)',
            '9:16': '9:16 (Portrait Widescreen)',
        };

        if (userModel === 'flux-edit' || userModel === 'flux_edit' || userModel === 'flux') {
            // --- FLUX-EDIT WORKFLOW ---
            workflow = JSON.parse(JSON.stringify(fluxEditTemplate));

            // 1. Prompt on Node "92:109"
            if (workflow["92:109"]) {
                workflow["92:109"].inputs.text = userPrompt;
            }

            // 2. Aspect Ratio & Quality on Node "92:158"
            if (workflow["92:158"]) {
                if (userAspectRatio && aspectMap[userAspectRatio]) {
                    workflow["92:158"].inputs.aspect_ratio = aspectMap[userAspectRatio];
                } else if (userAspectRatio) {
                    workflow["92:158"].inputs.aspect_ratio = userAspectRatio;
                }

                if (userQuality === 'Fast') {
                    workflow["92:158"].inputs.megapixels = 0.75;
                } else if (userQuality === 'Max' || userQuality === 'Quality') {
                    workflow["92:158"].inputs.megapixels = 1.5;
                } else if (userQuality === 'Balanced') {
                    workflow["92:158"].inputs.megapixels = 1;
                }
            }

            // 3. Seed on Node "92:106"
            if (workflow["92:106"]) {
                workflow["92:106"].inputs.noise_seed = Math.floor(Math.random() * 1000000000000);
            }

            // 4. Pass Reference Images (capped up to 2 images) into Node "76" and Node "157"
            if (refs.length > 0) {
                const img1Name = await uploadImageToComfy(refs[0]);
                if (workflow["76"]) {
                    workflow["76"].inputs.image = img1Name;
                }

                if (refs.length > 1) {
                    const img2Name = await uploadImageToComfy(refs[1]);
                    if (workflow["157"]) {
                        workflow["157"].inputs.image = img2Name;
                    }
                } else {
                    if (workflow["157"]) {
                        workflow["157"].inputs.image = img1Name;
                    }
                }
            }
        } else if (userModel === 'ideogram4' || userModel === 'ideogram') {
            // --- IDEOGRAM4 WORKFLOW ---
            workflow = JSON.parse(JSON.stringify(ideogram4Template));

            // 1. Prompt on Node "185" (high_level_description)
            if (workflow["185"]) {
                workflow["185"].inputs.high_level_description = userPrompt;
            }

            // 2. Aspect Ratio & Quality on Node "191"
            if (workflow["191"]) {
                if (userAspectRatio && aspectMap[userAspectRatio]) {
                    workflow["191"].inputs.aspect_ratio = aspectMap[userAspectRatio];
                } else if (userAspectRatio) {
                    workflow["191"].inputs.aspect_ratio = userAspectRatio;
                }

                if (userQuality === 'Fast') {
                    workflow["191"].inputs.megapixel = "0.5";
                } else if (userQuality === 'Max' || userQuality === 'Quality') {
                    workflow["191"].inputs.megapixel = "1.5";
                } else if (userQuality === 'Balanced') {
                    workflow["191"].inputs.megapixel = "1.0";
                }
            }

            // 3. Seed on Node "197"
            if (workflow["197"]) {
                workflow["197"].inputs.seed = Math.floor(Math.random() * 1000000000000);
            }
        } else {
            // --- KREA2 WORKFLOW (DEFAULT) ---
            workflow = JSON.parse(JSON.stringify(workflowTemplate));

            // 1. Prompt on Node "6"
            if (workflow["6"]) {
                workflow["6"].inputs.text = userPrompt;
            }

            // 2. Aspect Ratio & Quality on Node "8"
            if (workflow["8"]) {
                if (userAspectRatio && aspectMap[userAspectRatio]) {
                    workflow["8"].inputs.aspect_ratio = aspectMap[userAspectRatio];
                } else if (userAspectRatio) {
                    workflow["8"].inputs.aspect_ratio = userAspectRatio;
                }

                if (userQuality === 'Fast') {
                    workflow["8"].inputs.megapixels = 0.75;
                } else if (userQuality === 'Max' || userQuality === 'Quality') {
                    workflow["8"].inputs.megapixels = 1.5;
                } else if (userQuality === 'Balanced') {
                    workflow["8"].inputs.megapixels = 1;
                }
            }

            // 3. Seed on Node "10"
            if (workflow["10"]) {
                workflow["10"].inputs.seed = Math.floor(Math.random() * 1000000000000);
            }
        }

        // Queue the prompt in ComfyUI
        const queueResponse = await fetch(`${COMFYUI_URL}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: workflow,
                client_id: "expo-api-route"
            })
        });

        if (!queueResponse.ok) {
            throw new Error(`Failed to queue prompt: ${queueResponse.statusText}`);
        }

        const queueData = await queueResponse.json();
        const promptId = queueData.prompt_id;

        // Poll ComfyUI's history endpoint
        let isComplete = false;
        let historyData: any = null;

        while (!isComplete) {
            await new Promise(resolve => setTimeout(resolve, 1500));

            const historyResponse = await fetch(`${COMFYUI_URL}/history/${promptId}`);
            const historyJson = await historyResponse.json();

            if (historyJson[promptId]) {
                isComplete = true;
                historyData = historyJson[promptId];
            }
        }

        // Extract output image filename dynamically
        let imageData: any = null;
        if (historyData?.outputs) {
            for (const nodeId of Object.keys(historyData.outputs)) {
                if (historyData.outputs[nodeId]?.images?.length > 0) {
                    imageData = historyData.outputs[nodeId].images[0];
                    break;
                }
            }
        }

        if (!imageData) {
            throw new Error('No output image returned from ComfyUI execution');
        }

        const subfolder = imageData.subfolder || "";
        const PUBLIC_COMFY_URL = 'http://192.168.31.78:8188';
        const imageUrl = `${PUBLIC_COMFY_URL}/view?filename=${imageData.filename}&subfolder=${subfolder}&type=${imageData.type}`;

        return Response.json({ success: true, imageUrl: imageUrl });

    } catch (error: any) {
        console.error("Generation API Route failed:", error);
        return Response.json(
            { success: false, error: error.message || 'Failed to generate image' },
            { status: 500 }
        );
    }
}