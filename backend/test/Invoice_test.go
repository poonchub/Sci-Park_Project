package unit

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
)

func TestInvoiceValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Valid Invoice", func(t *testing.T) {
		invoice := entity.Invoice{
			InvoiceNumber: "NE2/001",
			IssueDate: time.Now(),
			DueDate: time.Now().AddDate(0, 0, 30),
			BillingPeriod: time.Now(),
			TotalAmount: 1200,
			RoomID: 1,
			StatusID: 2,
			CreaterID: 2,
			CustomerID: 9,
		}

		ok, err := govalidator.ValidateStruct(invoice)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Missing Invoice Number", func(t *testing.T) {
		invoice := entity.Invoice{
			// InvoiceNumber: "NE2/001",
			IssueDate: time.Now(),
			DueDate: time.Now().AddDate(0, 0, 30),
			BillingPeriod: time.Now(),
			TotalAmount: 1200,
			RoomID: 1,
			StatusID: 2,
			CreaterID: 2,
			CustomerID: 9,
		}

		ok, err := govalidator.ValidateStruct(invoice)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("InvoiceNumber is required"))
	})

	t.Run("Missing Issue Date", func(t *testing.T) {
		invoice := entity.Invoice{
			InvoiceNumber: "NE2/001",
			// IssueDate: time.Now(),
			DueDate: time.Now().AddDate(0, 0, 30),
			BillingPeriod: time.Now(),
			TotalAmount: 1200,
			RoomID: 1,
			StatusID: 2,
			CreaterID: 2,
			CustomerID: 9,
		}

		ok, err := govalidator.ValidateStruct(invoice)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("IssueDate is required"))
	})

	t.Run("Missing Due Date", func(t *testing.T) {
		invoice := entity.Invoice{
			InvoiceNumber: "NE2/001",
			IssueDate: time.Now(),
			// DueDate: time.Now().AddDate(0, 0, 30),
			BillingPeriod: time.Now(),
			TotalAmount: 1200,
			RoomID: 1,
			StatusID: 2,
			CreaterID: 2,
			CustomerID: 9,
		}

		ok, err := govalidator.ValidateStruct(invoice)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("DueDate is required"))
	})

	t.Run("Missing Billing Period", func(t *testing.T) {
		invoice := entity.Invoice{
			InvoiceNumber: "NE2/001",
			IssueDate: time.Now(),
			DueDate: time.Now().AddDate(0, 0, 30),
			// BillingPeriod: time.Now(),
			TotalAmount: 1200,
			RoomID: 1,
			StatusID: 2,
			CreaterID: 2,
			CustomerID: 9,
		}

		ok, err := govalidator.ValidateStruct(invoice)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("BillingPeriod is required"))
	})

	t.Run("Missing Total Amount", func(t *testing.T) {
		invoice := entity.Invoice{
			InvoiceNumber: "NE2/001",
			IssueDate: time.Now(),
			DueDate: time.Now().AddDate(0, 0, 30),
			BillingPeriod: time.Now(),
			// TotalAmount: 1200,
			RoomID: 1,
			StatusID: 2,
			CreaterID: 2,
			CustomerID: 9,
		}

		ok, err := govalidator.ValidateStruct(invoice)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("TotalAmount is required"))
	})

	t.Run("Missing RoomID", func(t *testing.T) {
		invoice := entity.Invoice{
			InvoiceNumber: "NE2/001",
			IssueDate: time.Now(),
			DueDate: time.Now().AddDate(0, 0, 30),
			BillingPeriod: time.Now(),
			TotalAmount: 1200,
			// RoomID: 1,
			StatusID: 2,
			CreaterID: 2,
			CustomerID: 9,
		}

		ok, err := govalidator.ValidateStruct(invoice)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("RoomID is required"))
	})

	t.Run("Missing StatusID", func(t *testing.T) {
		invoice := entity.Invoice{
			InvoiceNumber: "NE2/001",
			IssueDate: time.Now(),
			DueDate: time.Now().AddDate(0, 0, 30),
			BillingPeriod: time.Now(),
			TotalAmount: 1200,
			RoomID: 1,
			// StatusID: 2,
			CreaterID: 2,
			CustomerID: 9,
		}

		ok, err := govalidator.ValidateStruct(invoice)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("StatusID is required"))
	})

	t.Run("Missing CreaterID", func(t *testing.T) {
		invoice := entity.Invoice{
			InvoiceNumber: "NE2/001",
			IssueDate: time.Now(),
			DueDate: time.Now().AddDate(0, 0, 30),
			BillingPeriod: time.Now(),
			TotalAmount: 1200,
			RoomID: 1,
			StatusID: 2,
			// CreaterID: 2,
			CustomerID: 9,
		}

		ok, err := govalidator.ValidateStruct(invoice)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("CreaterID is required"))
	})

	t.Run("Missing CustomerID", func(t *testing.T) {
		invoice := entity.Invoice{
			InvoiceNumber: "NE2/001",
			IssueDate: time.Now(),
			DueDate: time.Now().AddDate(0, 0, 30),
			BillingPeriod: time.Now(),
			TotalAmount: 1200,
			RoomID: 1,
			StatusID: 2,
			CreaterID: 2,
			// CustomerID: 9,
		}

		ok, err := govalidator.ValidateStruct(invoice)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("CustomerID is required"))
	})
}