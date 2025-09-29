package unit

import (
    "testing"
    "time"

    "github.com/asaskevich/govalidator"
    . "github.com/onsi/gomega"

    "sci-park_web-application/entity" // ให้ตรงกับ module ใน go.mod
)

func TestBookingDateValidation(t *testing.T) {
    g := NewGomegaWithT(t)

    t.Run("All fields are valid", func(t *testing.T) {
        bookingDate := entity.BookingDate{ BookingRoomID: 1, Date: time.Now() }
        ok, err := govalidator.ValidateStruct(bookingDate)
        g.Expect(ok).To(BeTrue())
        g.Expect(err).To(BeNil())
    })

    t.Run("BookingRoomID is required", func(t *testing.T) {
        bookingDate := entity.BookingDate{ BookingRoomID: 0, Date: time.Now() }
        ok, err := govalidator.ValidateStruct(&bookingDate)
        g.Expect(ok).To(BeFalse())
        g.Expect(err).NotTo(BeNil())
        g.Expect(err.Error()).To(Equal("BookingRoomID is required"))
    })

    t.Run("Date is required", func(t *testing.T) {
        bookingDate := entity.BookingDate{ BookingRoomID: 1, Date: time.Time{} }
        ok, err := govalidator.ValidateStruct(&bookingDate)
        g.Expect(ok).To(BeFalse())
        g.Expect(err).NotTo(BeNil())
        g.Expect(err.Error()).To(Equal("Date is required"))
    })

    t.Run("Pointer is not nil", func(t *testing.T) {
        bookingDate := &entity.BookingDate{ BookingRoomID: 1, Date: time.Now() }
        g.Expect(bookingDate).NotTo(BeNil())
    })

    t.Run("Error is not nil when validation fails", func(t *testing.T) {
        bookingDate := entity.BookingDate{ BookingRoomID: 0, Date: time.Now() }
        _, err := govalidator.ValidateStruct(&bookingDate)
        g.Expect(err).NotTo(BeNil())
    })
}
