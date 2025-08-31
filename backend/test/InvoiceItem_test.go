package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
)

func TestInvoiceItemValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Valid InvoiceItem", func(t *testing.T) {
		invoiceItem := entity.InvoiceItem{
			Description: "ค่าไฟฟ้า",
			Amount: 500,
			InvoiceID: 1,
		}

		ok, err := govalidator.ValidateStruct(invoiceItem)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Missing Description", func(t *testing.T) {
		invoiceItem := entity.InvoiceItem{
			// Description: "ค่าไฟฟ้า",
			Amount: 500,
			InvoiceID: 1,
		}

		ok, err := govalidator.ValidateStruct(invoiceItem)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Description is required"))
	})

	t.Run("Missing Amount", func(t *testing.T) {
		invoiceItem := entity.InvoiceItem{
			Description: "ค่าไฟฟ้า",
			// Amount: 500,
			InvoiceID: 1,
		}

		ok, err := govalidator.ValidateStruct(invoiceItem)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Amount is required"))
	})

	t.Run("Missing InvoiceID", func(t *testing.T) {
		invoiceItem := entity.InvoiceItem{
			Description: "ค่าไฟฟ้า",
			Amount: 500,
			// InvoiceID: 1,
		}

		ok, err := govalidator.ValidateStruct(invoiceItem)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("InvoiceID is required"))
	})
}