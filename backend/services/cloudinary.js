const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log("[Cloudinary] Initialized with cloud:", process.env.CLOUDINARY_CLOUD_NAME);
} else {
  console.log("[Cloudinary] No credentials provided, running in local fallback mode.");
}

// Fallback local temp directory
const TEMP_STORAGE_DIR = path.join(__dirname, "..", "data", "temp_cloudinary_proofs");

/**
 * Upload student medical proof document to Cloudinary (or local simulation fallback)
 */
async function uploadProofToCloudinary(fileDataUrlOrBuffer, fileName, applicationId) {
  const cleanAppId = (applicationId || "DAV-APP").replace(/[^a-zA-Z0-9_-]/g, "_");
  const ext = (path.extname(fileName || "proof.pdf").toLowerCase().replace(".", "")) || "pdf";

  // If live Cloudinary credentials exist
  if (isConfigured) {
    try {
      const uploadRes = await cloudinary.uploader.upload(
        typeof fileDataUrlOrBuffer === "string"
          ? fileDataUrlOrBuffer
          : `data:application/octet-stream;base64,${fileDataUrlOrBuffer.toString("base64")}`,
        {
          folder: "dav-university/medical-proofs",
          resource_type: "auto",
          public_id: `${cleanAppId}_proof_${Date.now()}`,
          overwrite: true,
          use_filename: true,
          tags: ["dav_medical_leave", "medical_proof", cleanAppId],
        }
      );

      return {
        success: true,
        publicId: uploadRes.public_id,
        url: uploadRes.secure_url || uploadRes.url,
        secureUrl: uploadRes.secure_url || uploadRes.url,
        resourceType: uploadRes.resource_type || "raw",
        format: uploadRes.format || ext,
        originalName: fileName,
        bytes: uploadRes.bytes || 0,
        uploadedAt: new Date().toISOString(),
        isSimulated: false,
      };
    } catch (err) {
      console.warn("[Cloudinary] Live upload error, falling back to simulated storage:", err.message);
    }
  }

  // Simulated Storage Fallback
  try {
    const appDir = path.join(TEMP_STORAGE_DIR, cleanAppId);
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }

    const safeFileName = `${Date.now()}_${(fileName || "proof.pdf").replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(appDir, safeFileName);

    let buffer;
    if (typeof fileDataUrlOrBuffer === "string") {
      const base64Data = fileDataUrlOrBuffer.includes(",")
        ? fileDataUrlOrBuffer.split(",")[1]
        : fileDataUrlOrBuffer;
      buffer = Buffer.from(base64Data, "base64");
    } else {
      buffer = fileDataUrlOrBuffer;
    }

    fs.writeFileSync(filePath, buffer);

    const publicId = `dav-medical-leave/simulated/${cleanAppId}/${safeFileName}`;
    const simulatedUrl = `/api/sync/proof-stream?appId=${encodeURIComponent(
      cleanAppId
    )}&file=${encodeURIComponent(safeFileName)}`;

    return {
      success: true,
      publicId,
      url: simulatedUrl,
      secureUrl: simulatedUrl,
      resourceType: ext === "pdf" ? "raw" : "image",
      format: ext,
      originalName: fileName,
      bytes: buffer.length,
      uploadedAt: new Date().toISOString(),
      isSimulated: true,
    };
  } catch (err) {
    console.error("[Cloudinary] Failed to store proof in temporary storage:", err);
    throw new Error("Failed to store medical proof: " + (err.message || "Unknown error"));
  }
}

/**
 * Delete medical proof from Cloudinary after verified sync
 */
async function deleteProofFromCloudinary(publicId, resourceType) {
  if (!publicId) {
    return { success: true, message: "No publicId provided", result: "empty" };
  }

  if (isConfigured && !publicId.includes("simulated")) {
    try {
      const primaryType = resourceType === "raw" || resourceType === "pdf" ? "raw" : "image";
      const secondaryType = primaryType === "raw" ? "image" : "raw";

      let res = await cloudinary.uploader.destroy(publicId, {
        resource_type: primaryType,
        invalidate: true,
      });

      if (res.result === "not found") {
        const altRes = await cloudinary.uploader.destroy(publicId, {
          resource_type: secondaryType,
          invalidate: true,
        });
        if (altRes.result === "ok") {
          res = altRes;
        }
      }

      if (res.result === "ok" || res.result === "not found") {
        return {
          success: true,
          message:
            res.result === "not found"
              ? "Asset was already removed from Cloudinary"
              : "Deleted from Cloudinary successfully",
          result: res.result,
        };
      }

      return {
        success: false,
        message: `Cloudinary response: ${res.result}`,
        result: res.result,
      };
    } catch (err) {
      console.warn("[Cloudinary] Failed to delete from live Cloudinary:", err.message);
      return { success: false, message: err.message || "Cloudinary deletion failed" };
    }
  }

  // Simulated deletion
  try {
    const parts = publicId.split("/");
    const fileName = parts[parts.length - 1];
    const appId = parts[parts.length - 2] || "temp";
    const filePath = path.join(TEMP_STORAGE_DIR, appId, fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return { success: true, message: "Simulated Cloudinary temporary file removed", result: "ok" };
  } catch (err) {
    console.warn("[Cloudinary] Failed to delete simulated file:", err.message);
    return { success: false, message: err.message || "Simulated cleanup failed" };
  }
}

module.exports = {
  isConfigured,
  uploadProofToCloudinary,
  deleteProofFromCloudinary,
};
