import { MaintenaceImagesInterface } from "../interfaces/IMaintenaceImages";
import { apiUrl } from "../services/http";

export const convertPathsToFiles = async (images: MaintenaceImagesInterface[]): Promise<File[]> => {
    return await Promise.all(
        images.map(async (img, index) => {
            const url = apiUrl + "/" + img.FilePath;
            const response = await fetch(url);
            const blob = await response.blob();
            const fileType = blob.type || "image/jpeg";
            const fileName = img.FilePath?.split("/").pop() || `image${index + 1}.jpg`;
            return new File([blob], fileName, { type: fileType });
        })
    );
};
