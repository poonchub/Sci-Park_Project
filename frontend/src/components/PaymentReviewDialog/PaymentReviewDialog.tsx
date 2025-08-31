// import React from "react";
// import {
//   Box,
//   Button,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Grid,
//   Typography,
//   ImageList,
//   ImageListItem,
// } from "@mui/material";

// type PaymentStatus = "unpaid" | "submitted" | "paid" | "refunded";

// export type BookingLike = {
//   ID: number;
//   User?: { FirstName?: string; LastName?: string; EmployeeID?: string };
//   Purpose?: string;
//   Room?: { RoomNumber?: string | number; Floor?: { Number?: number } };
//   Payment?: {
//     status?: PaymentStatus;
//     slipImages?: string[]; // urls หรือ path รูปสลิป
//     note?: string;
//   };
// };

// type Props = {
//   open: boolean;
//   booking: BookingLike | null;
//   onClose: () => void;
//   onApprove: () => void;
//   onReject: () => void;
// };

// const PaymentReviewDialog: React.FC<Props> = ({ open, booking, onClose, onApprove, onReject }) => {
//   const slips = booking?.Payment?.slipImages || [];

//   return (
//     <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
//       <DialogTitle>Payment Review · #{booking?.ID}</DialogTitle>

//       <DialogContent dividers>
//         <Grid container spacing={2}>
//           <Grid item xs={12} md={6}>
//             <Typography fontWeight={700} gutterBottom>Booker</Typography>
//             <Typography>
//               {booking?.User?.FirstName} {booking?.User?.LastName} ({booking?.User?.EmployeeID || "-"})
//             </Typography>

//             <Box mt={2}>
//               <Typography fontWeight={700} gutterBottom>Room</Typography>
//               <Typography>
//                 Room {booking?.Room?.RoomNumber ?? "-"} · Floor {booking?.Room?.Floor?.Number ?? "-"}
//               </Typography>
//             </Box>

//             <Box mt={2}>
//               <Typography fontWeight={700} gutterBottom>Purpose</Typography>
//               <Typography>{booking?.Purpose || "-"}</Typography>
//             </Box>

//             <Box mt={2}>
//               <Typography fontWeight={700} gutterBottom>Payment Status</Typography>
//               <Typography>{booking?.Payment?.status || "unpaid"}</Typography>
//             </Box>
//           </Grid>

//           <Grid item xs={12} md={6}>
//             <Typography fontWeight={700} gutterBottom>Slip Images</Typography>

//             {slips.length ? (
//               <ImageList cols={2} gap={8} sx={{ m: 0 }}>
//                 {slips.map((src, i) => (
//                   <ImageListItem key={`slip-${i}`} sx={{ borderRadius: 2, overflow: "hidden" }}>
//                     {/* รองรับทั้ง absolute และ relative path */}
//                     <img
//                       src={src}
//                       alt={`slip-${i}`}
//                       loading="lazy"
//                       style={{ width: "100%", height: "100%", objectFit: "cover" }}
//                     />
//                   </ImageListItem>
//                 ))}
//               </ImageList>
//             ) : (
//               <Box
//                 sx={{
//                   p: 2,
//                   border: "1px dashed",
//                   borderColor: "divider",
//                   borderRadius: 2,
//                   color: "text.secondary",
//                 }}
//               >
//                 <Typography variant="body2">No slip images attached.</Typography>
//               </Box>
//             )}
//           </Grid>
//         </Grid>
//       </DialogContent>

//       <DialogActions>
//         <Button onClick={onReject} variant="outlined" color="inherit">
//           Reject
//         </Button>
//         <Button onClick={onApprove} variant="contained">
//           Approve
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// };

// export default PaymentReviewDialog;
