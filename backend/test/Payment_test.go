package unit

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
)

func TestPaymentValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Valid Payment", func(t *testing.T) {
		payment := entity.Payment{
			PaymentDate: time.Now(),
			Amount: 1200,
			SlipPath: "/image/slip.jpg",
			ReceiptPath: "/image/receipt.jpg",
			StatusID: 3,
			PayerID: 2,
			ApproverID: 1,
			BookingRoomID: 1,
		}

		ok, err := govalidator.ValidateStruct(payment)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Missing Payment Date", func(t *testing.T) {
		payment := entity.Payment{
			// PaymentDate: time.Now(),
			Amount: 1200,
			SlipPath: "/image/slip.jpg",
			ReceiptPath: "/image/receipt.jpg",
			StatusID: 3,
			PayerID: 2,
			ApproverID: 1,
			BookingRoomID: 1,
		}

		ok, err := govalidator.ValidateStruct(payment)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("PaymentDate is required"))
	})

	t.Run("Missing Amount", func(t *testing.T) {
		payment := entity.Payment{
			PaymentDate: time.Now(),
			// Amount: 1200,
			SlipPath: "/image/slip.jpg",
			ReceiptPath: "/image/receipt.jpg",
			StatusID: 3,
			PayerID: 2,
			ApproverID: 1,
			BookingRoomID: 1,
		}

		ok, err := govalidator.ValidateStruct(payment)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Amount is required"))
	})

	t.Run("Missing Slip Path", func(t *testing.T) {
		payment := entity.Payment{
			PaymentDate: time.Now(),
			Amount: 1200,
			// SlipPath: "/image/slip.jpg",
			ReceiptPath: "/image/receipt.jpg",
			StatusID: 3,
			PayerID: 2,
			ApproverID: 1,
			BookingRoomID: 1,
		}

		ok, err := govalidator.ValidateStruct(payment)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Slip file path is required"))
	})

	t.Run("Missing StatusID", func(t *testing.T) {
		payment := entity.Payment{
			PaymentDate: time.Now(),
			Amount: 1200,
			SlipPath: "/image/slip.jpg",
			ReceiptPath: "/image/receipt.jpg",
			// StatusID: 3,
			PayerID: 2,
			ApproverID: 1,
			BookingRoomID: 1,
		}

		ok, err := govalidator.ValidateStruct(payment)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("StatusID is required"))
	})

	t.Run("Missing PayerID", func(t *testing.T) {
		payment := entity.Payment{
			PaymentDate: time.Now(),
			Amount: 1200,
			SlipPath: "/image/slip.jpg",
			ReceiptPath: "/image/receipt.jpg",
			StatusID: 3,
			// PayerID: 2,
			ApproverID: 1,
			BookingRoomID: 1,
		}

		ok, err := govalidator.ValidateStruct(payment)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("PayerID is required"))
	})
}