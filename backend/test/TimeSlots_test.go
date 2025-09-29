package unit


import (
"testing"
"time"
"github.com/asaskevich/govalidator"
. "github.com/onsi/gomega"
"sci-park_web-application/entity"
)


func TestTimeSlot_Validation(t *testing.T) {
g := NewGomegaWithT(t)
start := time.Date(2025, 9, 30, 9, 0, 0, 0, time.Local)
end := time.Date(2025, 9, 30, 12, 0, 0, 0, time.Local)


t.Run("Valid when all required provided", func(t *testing.T) {
ts := entity.TimeSlot{TimeSlotName: "Morning", StartTime: start, EndTime: end}
ok, err := govalidator.ValidateStruct(ts)
g.Expect(ok).To(BeTrue())
g.Expect(err).To(BeNil())
})


t.Run("TimeSlotName is required", func(t *testing.T) {
ts := entity.TimeSlot{StartTime: start, EndTime: end}
ok, err := govalidator.ValidateStruct(ts)
g.Expect(ok).To(BeFalse())
g.Expect(err).To(HaveOccurred())
g.Expect(err.Error()).To(ContainSubstring("กรุณาระบุช่วงเวลา"))
})


t.Run("StartTime is required", func(t *testing.T) {
ts := entity.TimeSlot{TimeSlotName: "Morning", EndTime: end}
ok, err := govalidator.ValidateStruct(ts)
g.Expect(ok).To(BeFalse())
g.Expect(err).To(HaveOccurred())
g.Expect(err.Error()).To(ContainSubstring("กรุณาระบุเวลาเริ่มต้น"))
})


t.Run("EndTime is required", func(t *testing.T) {
ts := entity.TimeSlot{TimeSlotName: "Morning", StartTime: start}
ok, err := govalidator.ValidateStruct(ts)
g.Expect(ok).To(BeFalse())
g.Expect(err).To(HaveOccurred())
g.Expect(err.Error()).To(ContainSubstring("กรุณาระบุเวลาสิ้นสุด"))
})
}