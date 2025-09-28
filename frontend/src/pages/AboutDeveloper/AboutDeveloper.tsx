import {
    faAngleLeft,
    faGraduationCap,
    faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Email, Facebook, GitHub, Phone } from "@mui/icons-material";
import {
    Avatar,
    Button,
    Card,
    CardContent,
    CardMedia,
    Container,
    Dialog,
    Grid,
    IconButton,
    Snackbar,
    Tooltip,
    Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl, ListContributors } from "../../services/http";
import { ContributorInterface } from "../../interfaces/IContributors";

const AboutDeveloper = () => {
    const navigate = useNavigate();

    const [contributors, setContributors] = useState<ContributorInterface[]>([])
    const [copied, setCopied] = useState('');
    const [open, setOpen] = useState(false);
    const [openImage, setOpenImage] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string>("");

    const getContributors = async () => {
        try {
            const res = await ListContributors()
            if (res) {
                setContributors(res)
            }
        } catch (error) {
            console.error("Error fetching organization info:", error);
        }
    }


    const handleCopy = async (phone: string) => {
        try {
            await navigator.clipboard.writeText(phone);
            setCopied(phone)
            setOpen(true)
        } catch (error) {
            console.error("Copy failed:", error);
        }
    };

    useEffect(() => {
        getContributors()
    }, [])

    const PersonCard = ({
        person,
    }: {
        person: ContributorInterface
    }) => (
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card sx={{ height: "100%" }}>
                <CardContent
                    sx={{
                        flexGrow: 1,
                        textAlign: "center",
                        p: 4,
                        gap: 1.2,
                        display: "flex",
                        flexDirection: "column",
                        height: '100%',
                        justifyContent: 'space-between'
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: "column", gap: 1 }}>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                mb: 1,
                            }}
                        >
                            <Avatar
                                src={`${apiUrl}/${person.ProfilePath}?t=${Date.now()}`}
                                alt={person.Name}
                                sx={{ width: 64, height: 64 }}
                                onClick={() => {
                                    setSelectedImage(`${apiUrl}/${person.ProfilePath}?t=${Date.now()}`)
                                    setOpenImage(true)
                                }}
                            />
                        </Box>
                        <Box>
                            <Typography variant="body1" gutterBottom>{person.Name}</Typography>
                            <Box
                                sx={{
                                    bgcolor: "rgba(128, 128, 128, 0.18)",
                                    px: 1.5,
                                    py: 0.25,
                                    borderRadius: 5,
                                    display: "inline-block",
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    sx={{ lineHeight: 1, fontWeight: 500 }}
                                >
                                    {person.Role}
                                </Typography>
                            </Box>
                        </Box>

                        <p>{person.Bio}</p>
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            gap: 1,
                            justifyContent: "center",
                        }}
                    >
                        {person.Email && (
                            <Tooltip title={person.Email}>
                                <a href={`mailto:${person.Email}`}>
                                    <IconButton
                                        size="small"
                                        sx={{
                                            bgcolor: "primary.main",
                                            color: "white",
                                            "&:hover": {
                                                color: 'text.primary'
                                            }
                                        }}
                                    >
                                        <Email />
                                    </IconButton>
                                </a>
                            </Tooltip>
                        )}

                        {person.GithubUrl && (
                            <Tooltip title={person.GithubUrl}>
                                <a
                                    href={person.GithubUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <IconButton
                                        size="small"
                                        sx={{
                                            bgcolor: "primary.main",
                                            color: "white",
                                            "&:hover": {
                                                color: 'text.primary'
                                            }
                                        }}
                                    >
                                        <GitHub />
                                    </IconButton>
                                </a>
                            </Tooltip>
                        )}
                        {person.FacebookUrl && (
                            <Tooltip title={person.FacebookUrl}>
                                <a
                                    href={person.FacebookUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1"
                                >
                                    <IconButton
                                        size="small"
                                        sx={{
                                            bgcolor: "primary.main",
                                            color: "white",
                                            "&:hover": {
                                                color: 'text.primary'
                                            }
                                        }}
                                    >
                                        <Facebook />
                                    </IconButton>
                                </a>
                            </Tooltip>
                        )}
                        {person.Phone && (
                            <>
                                <Tooltip title={person.Phone}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleCopy(person.Phone || '')}
                                        sx={{
                                            bgcolor: "primary.main",
                                            color: "white",
                                            "&:hover": {
                                                color: 'text.primary'
                                            }
                                        }}
                                    >
                                        <Phone />
                                    </IconButton>
                                </Tooltip>
                                <Snackbar
                                    open={open}
                                    autoHideDuration={2000}
                                    onClose={() => setOpen(false)}
                                    message={`✅ Phone number ${copied} copied`}
                                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                                />
                            </>


                        )}
                    </Box>
                </CardContent>
            </Card>
        </Grid>
    );

    const developer = contributors.filter((person) => person.ContributorType?.Name === "Developer")
    const supervisor = contributors.filter((person) => person.ContributorType?.Name === "Supervisor")
    const sponsor = contributors.filter((person) => person.ContributorType?.Name === "Sponsor")

    return (
        <div className="about-developer-page">

            <Dialog
                open={openImage}
                onClose={() => {
                    setOpenImage(false);
                }}
                maxWidth={false}
                sx={{
                    '& .MuiDialog-paper': {
                        maxWidth: {
                            xs: '20vw',
                            sm: '',
                            md: '20vw',
                        },
                        width: 'auto',
                        margin: 0,
                        borderRadius: 0,
                    },
                }}
            >
                <CardMedia
                    component="img"
                    image={selectedImage}
                    alt="image"
                    sx={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                    }}
                />
            </Dialog>

            <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
                <Grid container spacing={3}>
                    <Grid className="title-box" size={{ xs: 5, md: 5 }}>
                        <Typography
                            variant="h5"
                            className="title"
                            sx={{ fontWeight: 700 }}
                        >
                            Development Team
                        </Typography>
                    </Grid>

                    {/* Back Button */}
                    <Grid
                        container
                        size={{ xs: 7, md: 7 }}
                        sx={{ justifyContent: "flex-end", alignItems: 'start' }}
                    >
                        <Button variant="outlined" onClick={() => navigate(-1)}>
                            <FontAwesomeIcon icon={faAngleLeft} size="lg" />
                            <Typography variant="textButtonClassic">
                                ย้อนกลับ
                            </Typography>
                        </Button>
                    </Grid>

                    {/* Developers Section */}
                    <Grid container size={{ xs: 12 }} spacing={2}>
                        <Grid
                            container
                            direction="row"
                            sx={{ alignItems: "baseline" }}
                        >
                            <FontAwesomeIcon icon={faUsers} />
                            <Typography variant="h6">Developers</Typography>
                        </Grid>
                        <Grid container size={{ xs: 12 }}>
                            {developer.map((person, index) => (
                                <PersonCard key={index} person={person} />
                            ))}
                        </Grid>
                    </Grid>

                    {/* Supervisor Section */}
                    <Grid container size={{ xs: 12 }} spacing={1}>
                        <Grid
                            container
                            direction="row"
                            sx={{ alignItems: "baseline" }}
                        >
                            <FontAwesomeIcon icon={faGraduationCap} />
                            <Typography variant="h6">Supervisor</Typography>
                        </Grid>
                        <Grid container size={{ xs: 12 }}>
                            {supervisor.map((person, index) => (
                                <PersonCard key={index} person={person} />
                            ))}
                        </Grid>
                    </Grid>

                    {/* Industry Sponsor Section */}
                    <Grid container size={{ xs: 12 }} spacing={1}>
                        <Grid
                            container
                            direction="row"
                            sx={{ alignItems: "baseline" }}
                        >
                            <FontAwesomeIcon icon={faGraduationCap} />
                            <Typography variant="h6">Industry Sponsor</Typography>
                        </Grid>
                        <Grid container size={{ xs: 12 }}>
                            {sponsor.map((person, index) => (
                                <PersonCard key={index} person={person} />
                            ))}
                        </Grid>
                    </Grid>

                    {/* Footer */}
                    <Grid size={{ xs: 12 }} sx={{ textAlign: "center", mt: 2 }}>
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            fontSize={14}
                        >
                            Proudly developed by students for SCiPark • Academic
                            Year 2024
                        </Typography>
                    </Grid>
                </Grid>
            </Container>
        </div>
    );
};

export default AboutDeveloper;
