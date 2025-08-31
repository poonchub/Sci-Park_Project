import React, { useEffect, useState } from 'react';
import {
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  MenuItem,
  Grid,
  Box,
  Paper,
  Chip,
  IconButton,
  Card,
  CardContent,
  Fade,
  Slide,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import {
  Save,
  ImageIcon,
  Plus,
  Trash2,
  Settings,
  DollarSign,
  Grid3x3,
  Camera,
  X
} from 'lucide-react';
import { TextField } from "../../components/TextField/TextField";
import { Select } from "../../components/Select/Select";
import SuccessAlert from '../../components/Alert/SuccessAlert';
import ErrorAlert from '../../components/Alert/ErrorAlert';
import WarningAlert from '../../components/Alert/WarningAlert';
import InfoAlert from '../../components/Alert/InfoAlert';
import { RoomtypesInterface } from '../../interfaces/IRoomTypes';
import { apiUrl, GetRoomTypeById, UpdateRoomType, ListLayouts, ListTimeSlots, ListEquipments } from '../../services/http';

interface EditRoomTypePopupProps {
  roomTypeID: number;
  open: boolean;
  onClose: () => void;
}
// กันกด e/E/+/- ใน input type="number"
const blockNonNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
};

// บังคับค่าต่ำสุด = 1 (จำนวนเต็ม)
const clampMin1 = (val: any) => {
  const n = Number(val);
  return Number.isNaN(n) ? 1 : Math.max(1, Math.floor(n));
};

const EditRoomTypePopup: React.FC<EditRoomTypePopupProps> = ({ roomTypeID, open, onClose }) => {
  const { control, handleSubmit, formState: { errors }, getValues , setValue } = useForm();
  const [roomType, setRoomType] = useState<RoomtypesInterface | null>(null);
  const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);
  const [equipmentsMaster, setEquipmentsMaster] = useState<any[]>([]);
  const [timeSlotsMaster, setTimeSlotsMaster] = useState<any[]>([]);
  const [layoutsMaster, setLayoutsMaster] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // popup state
  const [openEquipmentDialog, setOpenEquipmentDialog] = useState(false);
  const [openLayoutDialog, setOpenLayoutDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (roomTypeID > 0) {
          const data = await GetRoomTypeById(roomTypeID);
          setRoomType(data);

          setValue('TypeName', data.TypeName || '');
          setValue('RoomSize', data.RoomSize || '');
          setValue('ForRental', data.ForRental || false);
          setValue('HasMultipleSizes', data.HasMultipleSizes || false);

          console.log('Fetched room type data:', data);
        }
      } catch (error) {
        console.error('Error loading room type:', error);
        setAlerts(prev => [...prev, { type: 'error', message: 'Failed to load room type data.' }]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [roomTypeID, setValue]);

  useEffect(() => {
    const fetchMasters = async () => {
      const eqs = await ListEquipments();
      const ts = await ListTimeSlots();
      const ls = await ListLayouts();
      setEquipmentsMaster(eqs || []);
      setTimeSlotsMaster(ts || []);
      setLayoutsMaster(ls || []);
    };
    fetchMasters();
  }, []);

  const handleSave = async (data: RoomtypesInterface) => {

    const hasInvalid =
      ((roomType ?? {}).RoomPrices ?? []).some(p => (p.Price ?? 0) < 1) ||
      ((roomType ?? {}).RoomTypeLayouts ?? []).some(l => (l.Capacity ?? 0) < 1) ||
      ((roomType ?? {}).RoomEquipments ?? []).some(e => (e.Quantity ?? 0) < 1) ||
      (getValues('RoomSize') ?? 0) < 1;
    if (hasInvalid) {
      setAlerts(prev => [...prev, { type: 'warning', message: 'Numeric fields must be at least 1.' }]);
      return;
    }

    if (!roomTypeID || !roomType) {
      setAlerts(prev => [...prev, { type: "error", message: "RoomTypeID not found" }]);
      return;
    }

    setLoading(true);
    const formDataToSend = new FormData();

    formDataToSend.append("TypeName", data.TypeName?.toString() ?? '');
    formDataToSend.append("ForRental", data.ForRental ? "true" : "false");
    formDataToSend.append("HasMultipleSizes", data.HasMultipleSizes ? "true" : "false");
    formDataToSend.append("RoomSize", data.RoomSize?.toString() ?? '');

    formDataToSend.append("RoomEquipments", JSON.stringify(roomType.RoomEquipments ?? []));
    formDataToSend.append("RoomPrices", JSON.stringify(roomType.RoomPrices ?? []));
    formDataToSend.append("RoomTypeLayouts", JSON.stringify(roomType.RoomTypeLayouts ?? []));
    formDataToSend.append(
      "RoomTypeImages",
      JSON.stringify(
        (roomType.RoomTypeImages ?? [])
          .filter(img => !img.file)
          .map(img => ({
            ID: img.ID ?? 0,
            RoomTypeID: roomTypeID,
            FilePath: img.FilePath,
          }))
      )
    );

    (roomType.RoomTypeImages ?? []).forEach(img => {
      if (img.file) {
        formDataToSend.append("images", img.file);
      }
    });

    try {
      const response = await UpdateRoomType(roomTypeID, formDataToSend);
      console.log("📥 Response:", response);

      if (response?.status === "success") {
        setAlerts(prev => [...prev, { type: "success", message: "Room Type updated successfully." }]);
        setTimeout(onClose, 2000);
      } else {
        setAlerts(prev => [...prev, { type: "error", message: "Failed to update Room Type." }]);
      }
    } catch (error: any) {
      console.error("❌ Update error:", error);
      setAlerts(prev => [...prev, { type: "error", message: "Unexpected error" }]);
    } finally {
      setLoading(false);
    }
  };

  const SectionHeader = ({ icon: Icon, title, color = "#1976d2" }: { icon: any, title: string, color?: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <Box sx={{
        p: 1,
        borderRadius: 2,
        backgroundColor: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={20} color={color} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
        {title}
      </Typography>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '80vh',

        }
      }}
      TransitionComponent={Slide}
      TransitionProps={{ direction: 'up' } as any}
    >
      <DialogTitle sx={{
        borderRadius: '12px 12px 0 0',
        mb: 0
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Edit Room Type
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Manage room type settings and configurations
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>

        {roomType && (
          <form onSubmit={handleSubmit(handleSave)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

              {/* Basic Information */}
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <SectionHeader icon={Settings} title="Basic Information" color="#2196f3" />

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 1, color: '#555' }}>
                      Room Type Name *
                    </Typography>
                    <Controller
                      name="TypeName"
                      control={control}
                      defaultValue={roomType.TypeName || ''}
                      rules={{ required: 'Please enter room type name' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          placeholder="Enter room type name"
                          error={!!errors.TypeName}
                          helperText={String(errors.TypeName?.message) || ''}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,

                            }
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 1, color: '#555' }}>
                      Room Size (sq.m.)
                    </Typography>
                    <Controller
                      name="RoomSize"
                      control={control}
                      defaultValue={roomType.RoomSize ?? 1}
                      rules={{
                        required: 'Please enter room size',
                        min: { value: 1, message: 'Minimum value is 1' },
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type="number"
                          fullWidth
                          placeholder="Enter room size"
                          inputProps={{ min: 1 }}
                          onKeyDown={blockNonNumericKeys}
                          onChange={(e) => field.onChange(clampMin1(e.target.value))}
                          error={!!errors.RoomSize}
                          helperText={String(errors.RoomSize?.message) || ''}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      )}
                    />


                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 1, color: '#555' }}>
                      For Rental
                    </Typography>
                    <Controller
                      name="ForRental"
                      control={control}
                      defaultValue={roomType.ForRental}
                      render={({ field }) => (
                        <Select
                          value={field.value ? "yes" : "no"}
                          onChange={(e) => field.onChange(e.target.value === "yes")}
                          fullWidth
                          sx={{
                            borderRadius: 2,

                          }}
                        >
                          <MenuItem value="yes">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip label="Yes" color="success" size="small" />
                            </Box>
                          </MenuItem>
                          <MenuItem value="no">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip label="No" color="default" size="small" />
                            </Box>
                          </MenuItem>
                        </Select>
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 1, color: '#555' }}>
                      Multiple Sizes
                    </Typography>
                    <Controller
                      name="HasMultipleSizes"
                      control={control}
                      defaultValue={roomType.HasMultipleSizes}
                      render={({ field }) => (
                        <Select
                          value={field.value ? "yes" : "no"}
                          onChange={(e) => field.onChange(e.target.value === "yes")}
                          fullWidth
                          sx={{
                            borderRadius: 2,

                          }}
                        >
                          <MenuItem value="yes">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip label="Yes" color="success" size="small" />
                            </Box>
                          </MenuItem>
                          <MenuItem value="no">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip label="No" color="default" size="small" />
                            </Box>
                          </MenuItem>
                        </Select>
                      )}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Equipment Section */}
              <Paper sx={{ p: 3, borderRadius: 3, }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <SectionHeader icon={Settings} title="Equipments" color="#ff9800" />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Plus size={16} />}
                      onClick={() => {
                        setRoomType({
                          ...roomType,
                          RoomEquipments: [
                            ...(roomType.RoomEquipments || []),
                            { Quantity: 1, EquipmentID: 0 } as any,
                          ],
                        });
                      }}
                      sx={{ borderRadius: 2 }}
                    >
                      Add Equipment
                    </Button>
                    {/* <Button
                      variant="contained"
                      startIcon={<Plus size={16} />}
                      onClick={() => setOpenEquipmentDialog(true)}
                      sx={{ 
                        borderRadius: 2,
                        background: 'linear-gradient(45deg, #ff9800, #f57c00)'
                      }}
                    >
                      Create New
                    </Button> */}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {(roomType.RoomEquipments ?? []).map((eq, index) => (
                    <Card key={index} sx={{ borderRadius: 2, }}>
                      <CardContent sx={{ p: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid size={{ xs: 12, md: 5 }}>
                            <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                              Equipment Type
                            </Typography>
                            <Select
                              value={eq.EquipmentID || ""}
                              onChange={(e) => {
                                const updated = [...(roomType.RoomEquipments ?? [])];
                                updated[index].EquipmentID = Number(e.target.value);
                                setRoomType({ ...roomType, RoomEquipments: updated });
                              }}
                              fullWidth
                              sx={{ borderRadius: 2 }}
                            >
                              {equipmentsMaster.map((item) => (
                                <MenuItem key={item.ID} value={item.ID}>
                                  {item.EquipmentName}
                                </MenuItem>
                              ))}
                            </Select>
                          </Grid>
                          <Grid size={{ xs: 12, md: 5 }} >
                            <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                              Quantity
                            </Typography>
                            <TextField
                              type="number"
                              value={eq.Quantity}
                              fullWidth
                              inputProps={{ min: 1 }}
                              onKeyDown={blockNonNumericKeys}
                              onChange={(e) => {
                                const updated = [...(roomType.RoomEquipments ?? [])];
                                updated[index].Quantity = clampMin1(e.target.value);
                                setRoomType({ ...roomType, RoomEquipments: updated });
                              }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />

                          </Grid>
                          <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', justifyContent: 'center' }}>
                            <IconButton
                              color="error"
                              onClick={() => {
                                const updated = (roomType.RoomEquipments ?? []).filter((_, i) => i !== index);
                                setRoomType({ ...roomType, RoomEquipments: updated });
                              }}
                              sx={{
                                backgroundColor: '#ffebee',
                                '&:hover': { backgroundColor: '#ffcdd2' }
                              }}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Paper>

              {/* Pricing Section */}
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <SectionHeader icon={DollarSign} title="Pricing" color="#4caf50" />
                  <Button
                    variant="outlined"
                    startIcon={<Plus size={16} />}
                    onClick={() => {
                      setRoomType({
                        ...roomType,
                        RoomPrices: [
                          ...(roomType.RoomPrices || []),
                          { Price: 1, TimeSlotID: 0 } as any,  // ← เปลี่ยนเป็น 1
                        ],
                      });
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    Add Price
                  </Button>

                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {(roomType.RoomPrices ?? []).map((price, index) => (
                    <Card key={index} sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid size={{ xs: 12, md: 6 }} >
                            <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                              Time Slot
                            </Typography>
                            <Select
                              value={price.TimeSlotID || ""}
                              onChange={(e) => {
                                const updated = [...(roomType.RoomPrices ?? [])];
                                updated[index].TimeSlotID = Number(e.target.value);
                                setRoomType({ ...roomType, RoomPrices: updated });
                              }}
                              fullWidth
                              sx={{ borderRadius: 2 }}
                            >
                              {timeSlotsMaster.map((ts) => (
                                <MenuItem key={ts.ID} value={ts.ID}>
                                  {ts.TimeSlotName}
                                </MenuItem>
                              ))}
                            </Select>
                          </Grid>
                          <Grid size={{ xs: 12, md: 1 }} >
                            <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                              Price (THB)
                            </Typography>
                            <TextField
                              type="number"
                              value={price.Price}
                              fullWidth
                              inputProps={{ min: 1 }}
                              onKeyDown={blockNonNumericKeys}
                              onChange={(e) => {
                                const updated = [...(roomType.RoomPrices ?? [])];
                                updated[index].Price = clampMin1(e.target.value);
                                setRoomType({ ...roomType, RoomPrices: updated });
                              }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />

                          </Grid>
                          <Grid size={{ xs: 12, md: 1 }} sx={{ display: 'flex', justifyContent: 'center' }}>
                            <IconButton
                              color="error"
                              onClick={() => {
                                const updated = (roomType.RoomPrices ?? []).filter((_, i) => i !== index);
                                setRoomType({ ...roomType, RoomPrices: updated });
                              }}
                              sx={{
                                backgroundColor: '#ffebee',
                                '&:hover': { backgroundColor: '#ffcdd2' }
                              }}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Paper>

              {/* Layouts Section */}
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <SectionHeader icon={Grid3x3} title="Layouts" color="#9c27b0" />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Plus size={16} />}
                      onClick={() => {
                        setRoomType({
                          ...roomType,
                          RoomTypeLayouts: [
                            ...(roomType.RoomTypeLayouts || []),
                            // แก้ค่าเริ่มต้นตรงนี้จาก 0 → 1
                            { Capacity: 1, Note: "", RoomLayoutID: 0 } as any,
                          ],
                        });
                      }}
                      sx={{ borderRadius: 2 }}
                    >
                      Add Layout
                    </Button>

                    {/* <Button
                      variant="contained"
                      startIcon={<Plus size={16} />}
                      onClick={() => setOpenLayoutDialog(true)}
                      sx={{ 
                        borderRadius: 2,
                        background: 'linear-gradient(45deg, #9c27b0, #7b1fa2)'
                      }}
                    >
                      Create New
                    </Button> */}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {(roomType.RoomTypeLayouts ?? []).map((layout, index) => (
                    <Card key={index} sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid size={{ xs: 12, md: 4 }} >
                            <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                              Layout Type
                            </Typography>
                            <Select
                              value={layout.RoomLayoutID || ""}
                              onChange={(e) => {
                                const updated = [...(roomType.RoomTypeLayouts ?? [])];
                                updated[index].RoomLayoutID = Number(e.target.value);
                                setRoomType({ ...roomType, RoomTypeLayouts: updated });
                              }}
                              fullWidth
                              sx={{ borderRadius: 2 }}
                            >
                              {layoutsMaster.map((lt) => (
                                <MenuItem key={lt.ID} value={lt.ID}>
                                  {lt.LayoutName}
                                </MenuItem>
                              ))}
                            </Select>
                          </Grid>
                          <Grid size={{ xs: 12, md: 3 }} >
                            <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                              Capacity
                            </Typography>
                            <TextField
                              type="number"
                              value={layout.Capacity}
                              fullWidth
                              inputProps={{ min: 1 }}
                              onKeyDown={blockNonNumericKeys}
                              onChange={(e) => {
                                const updated = [...(roomType.RoomTypeLayouts ?? [])];
                                updated[index].Capacity = clampMin1(e.target.value);
                                setRoomType({ ...roomType, RoomTypeLayouts: updated });
                              }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />

                          </Grid>
                          <Grid size={{ xs: 12, md: 4 }} >
                            <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>
                              Note
                            </Typography>
                            <TextField
                              value={layout.Note || ""}
                              fullWidth
                              placeholder="Optional note"
                              onChange={(e) => {
                                const updated = [...(roomType.RoomTypeLayouts ?? [])];
                                updated[index].Note = e.target.value;
                                setRoomType({ ...roomType, RoomTypeLayouts: updated });
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2
                                }
                              }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 1 }} sx={{ display: 'flex', justifyContent: 'center' }}>
                            <IconButton
                              color="error"
                              onClick={() => {
                                const updated = (roomType.RoomTypeLayouts ?? []).filter((_, i) => i !== index);
                                setRoomType({ ...roomType, RoomTypeLayouts: updated });
                              }}
                              sx={{
                                backgroundColor: '#ffebee',
                                '&:hover': { backgroundColor: '#ffcdd2' }
                              }}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Paper>

              {/* Images Section */}
              <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 20px rgba(0,0,0,0.08)' }}>
                <SectionHeader icon={ImageIcon} title="Images" color="#f44336" />

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
                  {(roomType.RoomTypeImages ?? []).map((img, index) => (
                    <Fade in={true} key={index}>
                      <Card sx={{
                        position: 'relative',
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'scale(1.02)'
                        }
                      }}>
                        <Box sx={{ position: 'relative' }}>
                          <img
                            src={
                              img.file
                                ? URL.createObjectURL(img.file)
                                : `${apiUrl}/${img.FilePath?.replace(/^uploads/, "images")}`
                            }
                            alt="room"
                            style={{
                              width: 120,
                              height: 100,
                              objectFit: "cover",
                              display: 'block'
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => {
                              const updated = (roomType.RoomTypeImages ?? []).filter((_, i) => i !== index);
                              setRoomType({ ...roomType, RoomTypeImages: updated });
                            }}
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              backgroundColor: 'rgba(244, 67, 54, 0.9)',
                              color: 'white',
                              width: 24,
                              height: 24,
                              '&:hover': {
                                backgroundColor: 'rgba(244, 67, 54, 1)',
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <X size={12} />
                          </IconButton>
                        </Box>
                      </Card>
                    </Fade>
                  ))}

                  {/* Add Image Button */}
                  <Card sx={{
                    borderRadius: 3,
                    border: '2px dashed #e0e0e0',

                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: '#2196f3',
                      backgroundColor: '#3d67a3ff'
                    }
                  }}>
                    <Button
                      component="label"
                      sx={{
                        width: 120,
                        height: 100,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        color: '#666'
                      }}
                    >
                      <Camera size={24} />
                      <Typography variant="caption">Add Image</Typography>
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setRoomType({
                              ...roomType,
                              RoomTypeImages: [
                                ...(roomType.RoomTypeImages || []),
                                { file, FilePath: "" } as any,
                              ],
                            });
                          }
                        }}
                      />
                    </Button>
                  </Card>
                </Box>
              </Paper>
            </Box>
          </form>
        )}
      </DialogContent>

      {/* Enhanced Dialog Actions */}
      <DialogActions sx={{
        p: 3,
        gap: 2
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            textTransform: 'none',
            fontWeight: 500
          }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(handleSave)}
          variant="contained"
          startIcon={loading ? undefined : <Save size={16} />}
          disabled={loading}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            textTransform: 'none',
            fontWeight: 600,
            background: 'linear-gradient(to right, #f44336ff, #d25d19ff)',
          }}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>

      {/* Enhanced Alert System */}
      {alerts.length > 0 && (
        <Box sx={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}>
          {alerts.map((alert, index) => (
            <Fade in={true} key={index}>
              <Box>
                {alert.type === 'success' && (
                  <SuccessAlert
                    message={alert.message}
                    onClose={() => setAlerts(alerts.filter((_, i) => i !== index))}
                    index={index}
                    totalAlerts={alerts.length}
                  />
                )}
                {alert.type === 'error' && (
                  <ErrorAlert
                    message={alert.message}
                    onClose={() => setAlerts(alerts.filter((_, i) => i !== index))}
                    index={index}
                    totalAlerts={alerts.length}
                  />
                )}
                {alert.type === 'warning' && (
                  <WarningAlert
                    message={alert.message}
                    onClose={() => setAlerts(alerts.filter((_, i) => i !== index))}
                    index={index}
                    totalAlerts={alerts.length}
                  />
                )}
                {alert.type === 'info' && (
                  <InfoAlert
                    message={alert.message}
                    onClose={() => setAlerts(alerts.filter((_, i) => i !== index))}
                    index={index}
                    totalAlerts={alerts.length}
                  />
                )}
              </Box>
            </Fade>
          ))}
        </Box>
      )}
    </Dialog>
  );
};

export default EditRoomTypePopup;