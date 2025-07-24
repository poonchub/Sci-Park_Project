import {
    faAngleLeft,
    faGraduationCap,
    faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Email, Facebook, GitHub, LinkedIn } from "@mui/icons-material";
import {
    Avatar,
    Badge,
    Button,
    Card,
    CardContent,
    Container,
    Grid,
    IconButton,
    Tooltip,
    Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl, ListDeveloperInfo } from "../../services/http";
import { DeveloperInterface } from "../../interfaces/IDeveloperInfo";

const AboutDeveloper = () => {
    const navigate = useNavigate();

    const [developers, setDevelopers] = useState<DeveloperInterface[]>([])

    const getDeveloperInfo = async () => {
        try {
            const res = await ListDeveloperInfo()
            if (res) {
                setDevelopers(res)
            }
        } catch (error) {
            console.error("Error fetching organization info:", error);
        }
    }

    useEffect(() => {
        getDeveloperInfo()
    }, [])

    const teamMembers = {
        students: [
            {
                name: "Mr. Warawut Mueanduang",
                role: "Full Stack Developer",
                bio: "Passionate Full Stack Developer with a growth mindset, focused on clean architecture, seamless web apps, and always ready to collaborate.",
                avatar: "./aboutdevelopment/developers/Warawut_Mueanduang.jpg",
                initials: "WM",
                email: "ohmjares.22@gmail.com",
                github: "https://github.com/jares22",
                facebook: "https://www.facebook.com/ome.warawut.9",
            },
            {
                name: "Mr. Chanchai Lertsri",
                role: "Full Stack Developer",
                bio: "Full Stack Developer with a growth mindset, dedicated to crafting high-quality web applications with clean architecture and seamless user experiences.",
                avatar: "./aboutdevelopment/developers/Chanchai_Lertsri.jpg",
                initials: "CL",
                email: "chanchai.radsee@gmail.com",
                github: "https://github.com/Chanchai2004",
                facebook: "https://www.facebook.com/got.chanchai.2025",
            },
            {
                name: "Mr. Poonchub Nanawan",
                role: "Full Stack Developer",
                bio: "Full Stack Developer with a passion for creating clean, efficient, and user-friendly web applications.",
                avatar: "./aboutdevelopment/developers/Poonchub_Nanawan.jpg",
                initials: "PN",
                email: "poonchubnanawan310@gmail.com",
                github: "https://github.com/poonchub",
                facebook: "https://www.facebook.com/poonsub.nanawan/",
            },
        ],
        Supervisor: {
            name: "Dr. Komsan Srivisut",
            role: "Supervisor",
            bio: "Lecturer at Suranaree University of Technology with a PhD in Computer Science from the University of York, UK. Specialised in metaheuristics, hyper-heuristics, and optimisation techniques for software engineering and life sciences.",
            avatar: "./aboutdevelopment/advisors/Komsan_Srivisut.jpg",
            initials: "KS",
            email: "komsan@sut.ac.th",
            facebook: "https://www.facebook.com/srivisut"
        },
        supporter: {
            name: "Asst. Prof. Dr. Paphakorn Pittayachaval",
            role: "Industry Sponsor",
            bio: "Senior Product Manager at TechCorp who provided this learning opportunity. Believes in supporting the next generation of developers through real-world projects.",
            avatar: "./aboutdevelopment/advisors/Paphakorn_Pittayachaval.jpg",
            initials: "PP",
            email: "paphakorn@sut.ac.th",
        },
    };

    const DevCard = ({
        developer,
    }: {
        developer: DeveloperInterface
    }) => (
        <Grid size={{ xs: 4 }}>
            <Card sx={{ height: "100%" }}>
                <CardContent
                    sx={{
                        flexGrow: 1,
                        textAlign: "center",
                        p: 4,
                        gap: 1.2,
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            mb: 1,
                        }}
                    >
                        <Avatar
                            src={`${apiUrl}/${developer.ProfilePath}`}
                            alt={developer.Name}
                            sx={{ width: 64, height: 64 }}
                        />
                    </Box>

                    <Box>
                        <Typography variant="body1">{developer.Name}</Typography>

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
                                {developer.Role}
                            </Typography>
                        </Box>
                    </Box>

                    <p>{developer.Bio}</p>

                    <Box
                        sx={{
                            display: "flex",
                            gap: 1,
                            justifyContent: "center",
                        }}
                    >
                        {developer.Email && (
                            <Tooltip title={developer.Email}>
                                <a href={`mailto:${developer.Email}`}>
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

                        {developer.GithubUrl && (
                            <Tooltip title={developer.GithubUrl}>
                                <a
                                    href={developer.GithubUrl}
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
                        {developer.FacebookUrl && (
                            <Tooltip title={developer.FacebookUrl}>
                                <a
                                    href={developer.FacebookUrl}
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
                    </Box>
                </CardContent>
            </Card>
        </Grid>
    );

    const PersonCard = ({
        person,
        showContactButtons = true,
    }: {
        person: any;
        showContactButtons?: boolean;
    }) => (
        <Grid size={{ xs: 4 }}>
            <Card sx={{ height: "100%" }}>
                <CardContent
                    sx={{
                        flexGrow: 1,
                        textAlign: "center",
                        p: 4,
                        gap: 1.2,
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            mb: 1,
                        }}
                    >
                        <Avatar
                            src={person.avatar}
                            alt={person.name}
                            sx={{ width: 64, height: 64 }}
                        />
                    </Box>

                    <Box>
                        <Typography variant="body1">{person.name}</Typography>

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
                                {person.role}
                            </Typography>
                        </Box>
                    </Box>

                    <p>{person.bio}</p>

                    {showContactButtons && (
                        <Box
                            sx={{
                                display: "flex",
                                gap: 1,
                                justifyContent: "center",
                            }}
                        >
                            {person.email && (
                                <Tooltip title={person.email}>
                                    <a href={`mailto:${person.email}`}>
                                        <IconButton
                                            size="small"
                                            sx={{
                                                bgcolor: "primary.main",
                                                color: "white",
                                            }}
                                        >
                                            <Email />
                                        </IconButton>
                                    </a>
                                </Tooltip>
                            )}

                            {person.github && (
                                <Tooltip title={person.github}>
                                    <a
                                        href={person.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <IconButton
                                            size="small"
                                            sx={{
                                                bgcolor: "primary.main",
                                                color: "white",
                                            }}
                                        >
                                            <GitHub />
                                        </IconButton>
                                    </a>
                                </Tooltip>
                            )}
                            {person.facebook && (
                                <Tooltip title={person.facebook}>
                                    <a
                                        href={person.facebook}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1"
                                    >
                                        <IconButton
                                            size="small"
                                            sx={{
                                                bgcolor: "primary.main",
                                                color: "white",
                                            }}
                                        >
                                            <Facebook />
                                        </IconButton>
                                    </a>
                                </Tooltip>
                            )}
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Grid>
    );

    console.log(developers)

    return (
        <div className="about-developer-page">

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
                        sx={{ justifyContent: "flex-end" }}
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
                            {developers.map((developer, index) => (
                                <DevCard key={index} developer={developer} />
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
                            <PersonCard person={teamMembers.Supervisor} />
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
                            <PersonCard person={teamMembers.supporter} />
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
