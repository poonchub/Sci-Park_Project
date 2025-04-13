import { Grid2, ImageList, ImageListItem, Stack } from "@mui/material";
import { MaintenaceImagesInterface } from "../../interfaces/IMaintenaceImages";

interface RequestImagesProps {
    images: MaintenaceImagesInterface[];
    apiUrl: string;
}

const RequestImages: React.FC<RequestImagesProps> = ({ images, apiUrl }) => {
    const count = images.length;

    if (count === 1) {
        return (
            <Grid2 size={{ xs: 12, md: 12 }} sx={{ alignItems: "center" }}>
                <img
                    src={`${apiUrl}/${images[0].FilePath}`}
                    alt="image"
                    style={{ width: '100%', borderRadius: 8 }}
                />
            </Grid2>
        );
    }

    if (count === 2) {
        return (
            <>
                <Grid2 size={{ xs: 12, md: 6 }} sx={{ alignItems: "center" }}>
                    <img
                        src={`${apiUrl}/${images[0].FilePath}`}
                        alt="image1"
                        style={{ width: '100%', borderRadius: 8 }}
                    />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 6 }} sx={{ alignItems: "center" }}>
                    <img
                        src={`${apiUrl}/${images[1].FilePath}`}
                        alt="image2"
                        style={{ width: '100%', borderRadius: 8 }}
                    />
                </Grid2>
            </>
        );
    }

    if (count === 3) {
        return (
            <>
                <Grid2 size={{ xs: 12, md: 8 }} sx={{ alignItems: "center" }}>
                    <img
                        src={`${apiUrl}/${images[0].FilePath}`}
                        alt="image1"
                        style={{ width: '100%', borderRadius: 8 }}
                    />
                </Grid2>
                <Grid2 size={{ xs: 12, md: 4 }} sx={{ alignItems: "center" }}>
                    <Stack spacing={2}>
                        <img
                            src={`${apiUrl}/${images[1].FilePath}`}
                            alt="image2"
                            style={{ width: '100%', borderRadius: 8 }}
                        />
                        <img
                            src={`${apiUrl}/${images[2].FilePath}`}
                            alt="image3"
                            style={{ width: '100%', borderRadius: 8 }}
                        />
                    </Stack>
                </Grid2>
            </>
        );
    }

    return (
        <ImageList cols={3} gap={12} sx={{ width: '100%' }}>
            {images.map((img, i) => (
                <ImageListItem key={i}>
                    <img
                        src={`${apiUrl}/${img.FilePath}`}
                        alt={`image-${i + 1}`}
                        style={{ borderRadius: 8 }}
                    />
                </ImageListItem>
            ))}
        </ImageList>
    );
};

export default RequestImages;