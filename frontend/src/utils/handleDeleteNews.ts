import React, { useState } from "react";
import { DeleteNewsByID, DeleteNewsImagesByNewsID } from "../services/http";
import { NewsInterface } from "../interfaces/News";

type SetAlertFunction = (type: "error" | "success" | "warning", message: string) => void;

interface AlertMessage {
    type: "error" | "warning" | "success";
    message: string;
}

interface handleDeleteNewsProps {
    selectedNews?: NewsInterface;
    setIsDeleteButtonActive: React.Dispatch<React.SetStateAction<boolean>>;
    setLoadingStatus?: React.Dispatch<React.SetStateAction<"idle" | "loading" | "success">>;
    handleSetAlert: SetAlertFunction;
    setIsClickEdit?: React.Dispatch<React.SetStateAction<boolean>>;
    setAlerts: React.Dispatch<React.SetStateAction<AlertMessage[]>>
    setFiles: React.Dispatch<React.SetStateAction<File[]>>;
    onClose?: () => void;
    onUpdated?: () => void;
    successAlert?: boolean;
}

export const handleDeleteNews = async ({
    selectedNews,
    setIsDeleteButtonActive,
    setLoadingStatus,
    handleSetAlert,
    setIsClickEdit,
    setAlerts,
    setFiles,
    onUpdated,
    onClose,
    successAlert = false,
}: handleDeleteNewsProps) => {

    setIsDeleteButtonActive(true);
    setLoadingStatus?.('loading');

    if (!selectedNews?.ID) {
        console.error("News ID is missing. Cannot delete.")
        setIsDeleteButtonActive(false);
        setLoadingStatus?.('idle');
        return;
    }

    try {
        const imageLength = selectedNews.NewsImages?.length
        if (imageLength && imageLength > 0) {
            const resDeleteNewsImages = await DeleteNewsImagesByNewsID(selectedNews?.ID);
            if (!resDeleteNewsImages) {
                handleSetAlert("error", resDeleteNewsImages?.Error || "Failed to delete news");
                setIsDeleteButtonActive(false);
                setLoadingStatus?.('idle');
                return;
            }
        }

        const resDeleteNews = await DeleteNewsByID(selectedNews?.ID);
        if (!resDeleteNews) {
            handleSetAlert("error", resDeleteNews?.Error || "Failed to delete news");
            setIsDeleteButtonActive(false);
            setLoadingStatus?.('idle');
            return;
        }

        console.log("The news has been delete successfully.")

        setTimeout(() => {
            setLoadingStatus?.('success');
            setIsClickEdit?.(false);
            setAlerts([]);
            setFiles([]);
            if (successAlert){
                handleSetAlert("success", "The news has been delete successfully.");
            }
        }, 350);

        setTimeout(() => {
            onUpdated?.();
            setIsDeleteButtonActive(false);
            onClose?.();
            setLoadingStatus?.('idle');
        }, 2100);

    } catch (error) {
        console.error("Error deleting news:", error);
        handleSetAlert("error", "An unexpected error occurred during deletion.");
        setIsDeleteButtonActive(false);
        setLoadingStatus?.('idle');
    }
};