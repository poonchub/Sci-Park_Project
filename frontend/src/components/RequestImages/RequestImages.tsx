import { Grid, ImageList, ImageListItem, Stack } from "@mui/material";
import { MaintenaceImagesInterface } from "../../interfaces/IMaintenaceImages";

interface RequestImagesProps {
    images: MaintenaceImagesInterface[];
    apiUrl: string;
}

// Display images responsively based on the number of images provided
const RequestImages: React.FC<RequestImagesProps> = ({ images, apiUrl }) => {
    const count = images.length;

    // Display 1 image full width
    if (count === 1) {
        return (
            <Grid size={{ xs: 12, md: 12 }} sx={{ alignItems: "center" }}>
                <img
                    src={`${apiUrl}/${images[0].FilePath}`}
                    alt="image"
                    style={{ width: '100%', borderRadius: 8, maxHeight: '300px' }}
                />
            </Grid>
        );
    }

    // Display 2 images side by side
    if (count === 2) {
        return (
            <Grid container spacing={1} size={{ xs: 12, md: 12 }}>
                <Grid size={{ xs: 12, md: 6 }} sx={{ alignItems: "center" }}>
                    <img
                        src={`${apiUrl}/${images[0].FilePath}`}
                        alt="image1"
                        style={{ width: '100%', borderRadius: 8 }}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }} sx={{ alignItems: "center" }}>
                    <img
                        src={`${apiUrl}/${images[1].FilePath}`}
                        alt="image2"
                        style={{ width: '100%', borderRadius: 8 }}
                    />
                </Grid>
            </Grid>
        );
    }

    // Display 3 images with 1 large and 2 stacked
    if (count === 3) {
        return (
            <>
                <Grid size={{ xs: 12, md: 8 }} sx={{ alignItems: "center" }}>
                    <img
                        src={`${apiUrl}/${images[0].FilePath}`}
                        alt="image1"
                        style={{ width: '100%', borderRadius: 8 }}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }} sx={{ alignItems: "center" }}>
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
                </Grid>
            </>
        );
    }

    // For 4 or more images, use a grid layout
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