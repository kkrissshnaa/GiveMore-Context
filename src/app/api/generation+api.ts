// app/api/generation+api.ts
import workflowTemplate from './workflow_api.json'; // Adjust this path if needed

// The IP address of your ComfyUI machine
const COMFYUI_URL = 'http://127.0.0.1:8188';

export async function POST(request: Request) {
    try {
        // 1. Parse the incoming request body from your frontend
        const body = await request.json();
        const userPrompt = body.prompt;
        const userAspectRatio = body.aspectRatio;
        const userQuality = body.quality;

        if (!userPrompt) {
            return Response.json(
                { success: false, error: 'Prompt is required' },
                { status: 400 }
            );
        }

        // 2. Deep copy the template so concurrent requests don't overwrite each other
        const workflow = JSON.parse(JSON.stringify(workflowTemplate));

        // 3. Inject the user's prompt (Update "6" to your CLIPTextEncode node ID)
        workflow["6"].inputs.text = userPrompt;

        // 4. Update aspect ratio and resolution (megapixels) on Node 8
        if (workflow["8"]) {
            const aspectMap: Record<string, string> = {
                '1:1': '1:1 (Square)',
                '4:5': '4:5 (Portrait)',
                '16:9': '16:9 (Widescreen)',
                '9:16': '9:16 (Portrait Widescreen)',
            };
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

        // 5. Randomize the seed (Update "10" to your KSampler node ID)
        workflow["10"].inputs.seed = Math.floor(Math.random() * 1000000000000);

        // 5. Queue the prompt in ComfyUI
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

        // 6. Poll ComfyUI's history endpoint to check if the image is done
        let isComplete = false;
        let historyData: any = null;

        while (!isComplete) {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds

            const historyResponse = await fetch(`${COMFYUI_URL}/history/${promptId}`);
            const historyJson = await historyResponse.json();

            if (historyJson[promptId]) {
                isComplete = true;
                historyData = historyJson[promptId];
            }
        }

        // 7. Extract the output image filename
        const outputNodeId = Object.keys(historyData.outputs)[0];
        const imageData = historyData.outputs[outputNodeId].images[0];

        // Handle missing subfolders cleanly
        const subfolder = imageData.subfolder || "";

        // 8. Construct the direct image URL using your Wi-Fi IP
        const PUBLIC_COMFY_URL = 'http://192.168.31.78:8188';

        const imageUrl = `${PUBLIC_COMFY_URL}/view?filename=${imageData.filename}&subfolder=${subfolder}&type=${imageData.type}`;

        // Return standard Web API Response
        return Response.json({ success: true, imageUrl: imageUrl });

    } catch (error: any) {
        console.error("Generation API Route failed:", error);
        return Response.json(
            { success: false, error: error.message || 'Failed to generate image' },
            { status: 500 }
        );
    }
}