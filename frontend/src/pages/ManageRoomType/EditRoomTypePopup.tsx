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
  Image as ImageIcon,
  Plus,
  Trash2,
  Settings,
  DollarSign,
  Camera,
  X,
  Wrench,
  LayoutPanelLeft
} from 'lucide-react';
import { TextField } from "../../components/TextField/TextField";
import { Select } from "../../components/Select/Select";
import SuccessAlert from '../../components/Alert/SuccessAlert';
import ErrorAlert from '../../components/Alert/ErrorAlert';
import WarningAlert from '../../components/Alert/WarningAlert';
import InfoAlert from '../../components/Alert/InfoAlert';
import { RoomtypesInterface } from '../../interfaces/IRoomTypes';
import {
  apiUrl,
  GetRoomTypeById,
  UpdateRoomType,
  ListLayouts,
  ListTimeSlots,
  ListEquipments,
  CreateEquipment,
  CreateTimeSlot,
  CreateLayout
} from '../../services/http';

interface EditRoomTypePopupProps {
  roomTypeID: number;
  open: boolean;
  onClose: () => void;
}

// Block e/E/+/- in number inputs
const blockNonNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
};

// Clamp to integer min 1
const clampMin1 = (val: any) => {
  const n = Number(val);
  return Number.isNaN(n) ? 1 : Math.max(1, Math.floor(n));
};

type SectionVariant = 'basic' | 'equipments' | 'pricing' | 'layouts' | 'images';

const SectionHeader = ({ variant, title }: { variant: SectionVariant; title: string }) => {
  const map: Record<SectionVariant, { Icon: any; color: string }> = {
    basic: { Icon: Settings, color: '#2196f3' },
    equipments: { Icon: Wrench, color: '#ff9800' },
    pricing: { Icon: DollarSign, color: '#4caf50' },
    layouts: { Icon: LayoutPanelLeft, color: '#9c27b0' },
    images: { Icon: ImageIcon, color: '#f44336' },
  };
  const { Icon, color } = map[variant];
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <Box
        sx={{
          p: 1,
          borderRadius: 2,
          backgroundColor: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={20} color={color} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
    </Box>
  );
};

const EditRoomTypePopup: React.FC<EditRoomTypePopupProps> = ({ roomTypeID, open, onClose }) => {

  // +++
  type RTImage = { file?: File; FilePath?: string; RelativePath?: string };

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const dirInputRef = React.useRef<HTMLInputElement | null>(null);

  // ใส่ webkitdirectory ให้ input โฟลเดอร์ (Chrome/Edge/Safari)
  React.useEffect(() => {
    if (dirInputRef.current) {
      dirInputRef.current.setAttribute("webkitdirectory", "");
      dirInputRef.current.setAttribute("directory", "");
    }
  }, []);

  const handleAddFiles = React.useCallback((list: FileList | File[]) => {
    const files = Array.from(list).filter(f => f.type.startsWith("image/"));
    if (!files.length) return;

    const mapped: RTImage[] = files.map((f: File) => ({
      file: f,
      FilePath: "",
      RelativePath: (f as any).webkitRelativePath || f.name, // เก็บ path ภายในโฟลเดอร์ถ้ามี
    }));

    setRoomType(prev => ({
      ...(prev as any),
      RoomTypeImages: [...(prev?.RoomTypeImages || []), ...mapped],
    }));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleAddFiles(e.target.files);
      // รีเซ็ตเพื่อให้เลือกไฟล์ชื่อเดิมซ้ำได้อีก
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const { control, handleSubmit, formState: { errors }, getValues, setValue } = useForm();
  const [roomType, setRoomType] = useState<RoomtypesInterface | null>(null);
  const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);
  const [equipmentsMaster, setEquipmentsMaster] = useState<any[]>([]);
  const [timeSlotsMaster, setTimeSlotsMaster] = useState<any[]>([]);
  const [layoutsMaster, setLayoutsMaster] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ===== Inline Create Master Dialog =====
  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<null | 'equipment' | 'timeslot' | 'layout'>(null);
  const [pendingSelect, setPendingSelect] = useState<{ type: 'equipment' | 'timeslot' | 'layout', index: number } | null>(null);
  const [createForm, setCreateForm] = useState<{ name: string; start?: string; end?: string }>({ name: "", start: "09:00", end: "12:00" });

  const openCreate = (type: 'equipment' | 'timeslot' | 'layout', index: number) => {
    setCreateType(type);
    setPendingSelect({ type, index });
    setCreateForm({ name: "", start: "09:00", end: "12:00" });
    setCreateOpen(true);
  };
  const closeCreate = () => {
    setCreateOpen(false);
    setCreateType(null);
    setPendingSelect(null);
  };

  // --- แทนที่ฟังก์ชันเดิมทั้งหมด ---
  const handleCreateSubmit = async () => {
    if (!createForm.name?.trim()) {
      setAlerts(prev => [...prev, { type: 'warning', message: 'กรุณากรอกชื่อก่อนสร้างข้อมูลใหม่' }]);
      return;
    }

    try {
      if (createType === 'equipment') {
        const created = await CreateEquipment({ EquipmentName: createForm.name.trim() });
        if (!created) {
          setAlerts(p => [...p, { type: 'error', message: 'สร้างอุปกรณ์ไม่สำเร็จ' }]);
          return;
        }
        setEquipmentsMaster(prev => [...prev, created]);
        if (pendingSelect && roomType) {
          const updated = [...(roomType.RoomEquipments ?? [])];
          updated[pendingSelect.index].EquipmentID = (created.ID ?? created.id);
          setRoomType({ ...roomType, RoomEquipments: updated });
        }

      } else if (createType === 'timeslot') {
        const created = await CreateTimeSlot({
          TimeSlotName: createForm.name.trim(),
          StartTime: createForm.start || '09:00',
          EndTime: createForm.end || '12:00',
        });
        if (!created) {
          setAlerts(p => [...p, { type: 'error', message: 'สร้าง Time Slot ไม่สำเร็จ' }]);
          return;
        }
        setTimeSlotsMaster(prev => [...prev, created]);
        if (pendingSelect && roomType) {
          const updated = [...(roomType.RoomPrices ?? [])];
          updated[pendingSelect.index].TimeSlotID = (created.ID ?? created.id);
          setRoomType({ ...roomType, RoomPrices: updated });
        }

      } else if (createType === 'layout') {
        const created = await CreateLayout({ LayoutName: createForm.name.trim() });
        if (!created) {
          setAlerts(p => [...p, { type: 'error', message: 'สร้าง Layout ไม่สำเร็จ' }]);
          return;
        }
        setLayoutsMaster(prev => [...prev, created]);
        if (pendingSelect && roomType) {
          const updated = [...(roomType.RoomTypeLayouts ?? [])];
          updated[pendingSelect.index].RoomLayoutID = (created.ID ?? created.id);
          setRoomType({ ...roomType, RoomTypeLayouts: updated });
        }
      }

      setAlerts(prev => [...prev, { type: 'success', message: 'สร้างข้อมูลใหม่เรียบร้อย' }]);
      closeCreate();

    } catch (e: any) {
      setAlerts(prev => [...prev, { type: 'error', message: e?.message || 'สร้างข้อมูลไม่สำเร็จ' }]);
    }
  };

  // ===== Load data =====
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

    (roomType.RoomTypeImages ?? []).forEach((img: any) => {
      if (img.file) {
        formDataToSend.append("images", img.file); // อัปไฟล์
        formDataToSend.append("paths", img.RelativePath || img.file.name); // ส่ง path ภายในโฟลเดอร์ไปคู่กัน
      }
    });


    try {
      const response = await UpdateRoomType(roomTypeID, formDataToSend);
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{ sx: { borderRadius: 3, minHeight: '80vh' } }}
      TransitionComponent={Slide}
      TransitionProps={{ direction: 'up' } as any}
    >
      <DialogTitle sx={{ borderRadius: '12px 12px 0 0', mb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, flexWrap: 'wrap' }}>
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
                <SectionHeader variant="basic" title="Basic Information" />

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 1, }}>
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
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 1, }}>
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
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
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
                          sx={{ borderRadius: 2 }}
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
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
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
                          sx={{ borderRadius: 2 }}
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
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', sm: 'flex-start' },
                    mb: 2,
                    gap: 1,
                    flexWrap: 'wrap'
                  }}
                >
                  <SectionHeader variant="equipments" title="Equipments" />
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlinedGray"
                      startIcon={<Plus size={16} />}
                      onClick={() => {
                        setRoomType(prev => {
                          const next = { ...(prev as any) };
                          next.RoomEquipments = [...(prev?.RoomEquipments || []), { Quantity: 1, EquipmentID: 0 } as any];
                          return next;
                        });
                      }}
                      sx={{ borderRadius: 2 }}
                    >
                      Add Equipment
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Plus size={16} />}
                      onClick={() => {
                        const idx = (roomType?.RoomEquipments?.length ?? 0);
                        setRoomType(prev => {
                          const next = { ...(prev as any) };
                          next.RoomEquipments = [...(prev?.RoomEquipments || []), { Quantity: 1, EquipmentID: 0 } as any];
                          return next;
                        });
                        openCreate('equipment', idx);
                      }}
                      sx={{ borderRadius: 2 }}
                    >
                      New
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {(roomType.RoomEquipments ?? []).map((eq: any, index: number) => (
                    <Card key={index} sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid size={{ xs: 12, md: 5 }}>
                            <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                              Equipment Type
                            </Typography>
                            <Select
                              value={eq.EquipmentID || ""}
                              onChange={(e) => {
                                const updated = [...(roomType.RoomEquipments ?? [])];
                                updated[index].EquipmentID = Number(e.target.value);
                                setRoomType({ ...(roomType as any), RoomEquipments: updated });
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
                            <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
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
                                setRoomType({ ...(roomType as any), RoomEquipments: updated });
                              }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', justifyContent: 'center' }}>
                            <IconButton
                              color="error"
                              onClick={() => {
                                const updated = (roomType.RoomEquipments ?? []).filter((_: any, i: number) => i !== index);
                                setRoomType({ ...(roomType as any), RoomEquipments: updated });
                              }}
                              sx={{ backgroundColor: '#ffebee', '&:hover': { backgroundColor: '#ffcdd2' } }}
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
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', sm: 'flex-start' },
                    mb: 2,
                    gap: 1,
                    flexWrap: 'wrap'
                  }}
                >
                  <SectionHeader variant="pricing" title="Pricing" />
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlinedGray"
                      startIcon={<Plus size={16} />}
                      onClick={() => {
                        setRoomType(prev => {
                          const next = { ...(prev as any) };
                          next.RoomPrices = [...(prev?.RoomPrices || []), { Price: 1, TimeSlotID: 0 } as any];
                          return next;
                        });
                      }}
                      sx={{ borderRadius: 2 }}
                    >
                      Add Price
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Plus size={16} />}
                      onClick={() => {
                        const idx = (roomType?.RoomPrices?.length ?? 0);
                        setRoomType(prev => {
                          const next = { ...(prev as any) };
                          next.RoomPrices = [...(prev?.RoomPrices || []), { Price: 1, TimeSlotID: 0 } as any];
                          return next;
                        });
                        openCreate('timeslot', idx);
                      }}
                      sx={{ borderRadius: 2 }}
                    >
                      New
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {(roomType.RoomPrices ?? []).map((price: any, index: number) => (
                    <Card key={index} sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid size={{ xs: 12, md: 6 }} >
                            <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                              Time Slot
                            </Typography>
                            <Select
                              value={price.TimeSlotID || ""}
                              onChange={(e) => {
                                const updated = [...(roomType.RoomPrices ?? [])];
                                updated[index].TimeSlotID = Number(e.target.value);
                                setRoomType({ ...(roomType as any), RoomPrices: updated });
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
                            <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
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
                                setRoomType({ ...(roomType as any), RoomPrices: updated });
                              }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 1 }} sx={{ display: 'flex', justifyContent: 'center' }}>
                            <IconButton
                              color="error"
                              onClick={() => {
                                const updated = (roomType.RoomPrices ?? []).filter((_: any, i: number) => i !== index);
                                setRoomType({ ...(roomType as any), RoomPrices: updated });
                              }}
                              sx={{ backgroundColor: '#ffebee', '&:hover': { backgroundColor: '#ffcdd2' } }}
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
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', sm: 'flex-start' },
                    mb: 2,
                    gap: 1,
                    flexWrap: 'wrap'
                  }}
                >
                  <SectionHeader variant="layouts" title="Layouts" />
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlinedGray"
                      startIcon={<Plus size={16} />}
                      onClick={() => {
                        setRoomType(prev => {
                          const next = { ...(prev as any) };
                          next.RoomTypeLayouts = [...(prev?.RoomTypeLayouts || []), { Capacity: 1, Note: "", RoomLayoutID: 0 } as any];
                          return next;
                        });
                      }}
                      sx={{ borderRadius: 2 }}
                    >
                      Add Layout
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Plus size={16} />}
                      onClick={() => {
                        const idx = (roomType?.RoomTypeLayouts?.length ?? 0);
                        setRoomType(prev => {
                          const next = { ...(prev as any) };
                          next.RoomTypeLayouts = [...(prev?.RoomTypeLayouts || []), { Capacity: 1, Note: "", RoomLayoutID: 0 } as any];
                          return next;
                        });
                        openCreate('layout', idx);
                      }}
                      sx={{ borderRadius: 2 }}
                    >
                      New
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {(roomType.RoomTypeLayouts ?? []).map((layout: any, index: number) => (
                    <Card key={index} sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid size={{ xs: 12, md: 4 }} >
                            <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                              Layout Type
                            </Typography>
                            <Select
                              value={layout.RoomLayoutID || ""}
                              onChange={(e) => {
                                const updated = [...(roomType.RoomTypeLayouts ?? [])];
                                updated[index].RoomLayoutID = Number(e.target.value);
                                setRoomType({ ...(roomType as any), RoomTypeLayouts: updated });
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
                            <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
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
                                setRoomType({ ...(roomType as any), RoomTypeLayouts: updated });
                              }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 4 }} >
                            <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                              Note
                            </Typography>
                            <TextField
                              value={layout.Note || ""}
                              fullWidth
                              placeholder="Optional note"
                              onChange={(e) => {
                                const updated = [...(roomType.RoomTypeLayouts ?? [])];
                                updated[index].Note = e.target.value;
                                setRoomType({ ...(roomType as any), RoomTypeLayouts: updated });
                              }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 1 }} sx={{ display: 'flex', justifyContent: 'center' }}>
                            <IconButton
                              color="error"
                              onClick={() => {
                                const updated = (roomType.RoomTypeLayouts ?? []).filter((_: any, i: number) => i !== index);
                                setRoomType({ ...(roomType as any), RoomTypeLayouts: updated });
                              }}
                              sx={{ backgroundColor: '#ffebee', '&:hover': { backgroundColor: '#ffcdd2' } }}
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
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <SectionHeader variant="images" title="Images" />

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
                  {(roomType.RoomTypeImages ?? []).map((img: any, index: number) => (
                    <Fade in={true} key={index}>
                      <Card sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>
                        <Box sx={{ position: 'relative' }}>
                          <img
                            src={
                              img.file
                                ? URL.createObjectURL(img.file)
                                : `${apiUrl}/${img.FilePath?.replace(/^uploads/, "images")}`
                            }
                            alt="room"
                            style={{ width: 120, height: 100, objectFit: "cover", display: 'block' }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => {
                              const updated = (roomType.RoomTypeImages ?? []).filter((_: any, i: number) => i !== index);
                              setRoomType({ ...(roomType as any), RoomTypeImages: updated });
                            }}
                            sx={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(244, 67, 54, 0.9)', color: 'white', width: 24, height: 24, '&:hover': { backgroundColor: 'rgba(244, 67, 54, 1)', transform: 'scale(1.1)' } }}
                          >
                            <X size={12} />
                          </IconButton>
                        </Box>
                      </Card>
                    </Fade>
                  ))}

                  {/* Drag & Drop Zone */}
                  <Card
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    sx={{
                      borderRadius: 3,
                      border: '2px dashed #e0e0e0',
                      width: 240,
                      height: 100,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                    }}
                  >
                    <Typography variant="body2" align="center">
                      ลากรูป/โฟลเดอร์มาวางที่นี่
                    </Typography>
                  </Card>

                  {/* Add Images (หลายไฟล์) */}
                  <Card sx={{ borderRadius: 3, border: '2px dashed #e0e0e0' }}>
                    <Button component="label" sx={{ width: 120, height: 100, display: 'flex', flexDirection: 'column', gap: 1, color: '#666' }}>
                      <Camera size={24} />
                      <Typography variant="overline">Add Images</Typography>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={handleInputChange}
                      />
                    </Button>
                  </Card>

                  {/* Add Folder (ทั้งโฟลเดอร์) */}
                  <Card sx={{ borderRadius: 3, border: '2px dashed #e0e0e0' }}>
                    <Button component="label" sx={{ width: 120, height: 100, display: 'flex', flexDirection: 'column', gap: 1, color: '#666' }}>
                      <Typography variant="overline">Add Folder</Typography>
                      <input
                        ref={dirInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={handleInputChange}
                      />
                    </Button>
                  </Card>

                </Box>
              </Paper>
            </Box>
          </form>
        )}
      </DialogContent>

      {/* Create New Master Dialog */}
      <Dialog open={createOpen} onClose={closeCreate} fullWidth maxWidth="sm">
        <DialogTitle>
          {createType === 'equipment' && 'Create Equipment'}
          {createType === 'timeslot' && 'Create Time Slot'}
          {createType === 'layout' && 'Create Layout'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                {createType === 'equipment' && 'Equipment Name *'}
                {createType === 'timeslot' && 'Time Slot Name *'}
                {createType === 'layout' && 'Layout Name *'}
              </Typography>
              <TextField
                value={createForm.name}
                onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Enter name"
                fullWidth
              />
            </Grid>

            {createType === 'timeslot' && (
              <>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                    Start (HH:mm)
                  </Typography>
                  <TextField
                    value={createForm.start}
                    onChange={(e) => setCreateForm(f => ({ ...f, start: e.target.value }))}
                    placeholder="09:00"
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                    End (HH:mm)
                  </Typography>
                  <TextField
                    value={createForm.end}
                    onChange={(e) => setCreateForm(f => ({ ...f, end: e.target.value }))}
                    placeholder="12:00"
                    fullWidth
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, flexWrap: 'wrap', gap: 1 }}>
          <Button variant="outlinedGray" onClick={closeCreate}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              // ใช้ไอคอน Lucide ในปุ่ม
              handleCreateSubmit();
            }}
            startIcon={<Save size={16} />}

          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Footer Actions */}
      <DialogActions sx={{ p: 3, gap: 2, flexWrap: 'wrap' }}>
        <Button
          onClick={onClose}
          variant="outlinedGray"
          sx={{ borderRadius: 2, px: 3, py: 1, textTransform: 'none', fontWeight: 500 }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(handleSave)}
          variant="contained"
          startIcon={loading ? undefined : <Save size={16} />}
          disabled={loading}
          sx={{ borderRadius: 2, px: 3, py: 1, textTransform: 'none', fontWeight: 600, background: 'linear-gradient(to right, #f44336ff, #d25d19ff)' }}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Box sx={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 1 }}>
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
