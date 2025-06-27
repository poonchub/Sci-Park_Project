package unit

import (
    "testing"
    "github.com/asaskevich/govalidator"
    . "github.com/onsi/gomega"
    "sci-park_web-application/entity"
)

func TestRoomValidation(t *testing.T) {
    g := NewGomegaWithT(t)

    t.Run("Valid Room", func(t *testing.T) {
        room := entity.Room{
            RoomNumber:   "A101",
            Capacity:     30,
            RoomStatusID: 1,
            FloorID:      1,
            RoomTypeID:   1,
        }

        ok, err := govalidator.ValidateStruct(room)
        g.Expect(ok).To(BeTrue())
        g.Expect(err).To(BeNil())
    })

    t.Run("Missing Room Number", func(t *testing.T) {
        room := entity.Room{
            Capacity:     30,
            RoomStatusID: 1,
            FloorID:      1,
            RoomTypeID:   1,
        }

        ok, err := govalidator.ValidateStruct(room)
        g.Expect(ok).To(BeFalse())
        g.Expect(err).NotTo(BeNil())
    })

    t.Run("Missing RoomStatusID", func(t *testing.T) {
        room := entity.Room{
            RoomNumber: "B102",
            Capacity:   20,
            // Missing RoomStatusID
            FloorID:    2,
            RoomTypeID: 1,
        }

        ok, err := govalidator.ValidateStruct(room)
        g.Expect(ok).To(BeFalse())
        g.Expect(err).NotTo(BeNil())
    })

    t.Run("Zero Capacity", func(t *testing.T) {
        room := entity.Room{
            RoomNumber:   "C103",
            Capacity:     0, // Invalid if you assume must be > 0
            RoomStatusID: 2,
            FloorID:      1,
            RoomTypeID:   3,
        }

        ok, err := govalidator.ValidateStruct(room)
        g.Expect(ok).To(BeFalse())
        g.Expect(err).NotTo(BeNil())
    })
}
