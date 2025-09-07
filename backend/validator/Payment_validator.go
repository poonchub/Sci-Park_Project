package validator

import (
	"errors"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"strings"

	"github.com/asaskevich/govalidator"
)

func ValidatePayment(m *entity.Payment) error {

	_, err := govalidator.ValidateStruct(m)
	if err != nil {
		return err
	}

	db := config.DB()

	if m.BookingRoomID != 0 && m.RentalRoomInvoiceID != 0 {
		return errors.New("BookingRoomID and RentalRoomInvoiceID cannot both be set, only one is allowed")
	}
	if m.BookingRoomID == 0 && m.RentalRoomInvoiceID == 0 {
		return errors.New("Either BookingRoomID or RentalRoomInvoiceID must be set")
	}

	var rejectedStatus entity.PaymentStatus
	if err := db.Where("name = ?", "Rejected").First(&rejectedStatus).Error; err != nil {
		return errors.New("Request status named 'Rejected' was not found")
	}
	if m.StatusID == rejectedStatus.ID {
		if strings.TrimSpace(m.Note) == "" {
			return errors.New("A note is required when setting the request status to 'Rejected'")
		}
		if m.ApproverID == 0 {
			return errors.New("ApproverID is required when setting the request status to 'Rejected'")
		}
	}

	var awaitingReceiptStatus entity.PaymentStatus
	if err := db.Where("name = ?", "Awaiting Receipt").First(&awaitingReceiptStatus).Error; err != nil {
		return errors.New("Request status named 'Awaiting Receipt' was not found")
	}
	if m.StatusID == awaitingReceiptStatus.ID && m.ApproverID == 0 {
		return errors.New("ApproverID is required when setting the request status to 'Awaiting Receipt'")
	}

	var paidStatus entity.PaymentStatus
	if err := db.Where("name = ?", "Paid").First(&paidStatus).Error; err != nil {
		return errors.New("Request status named 'Paid' was not found")
	}
	if m.StatusID == paidStatus.ID {
		if strings.TrimSpace(m.ReceiptPath) == "" {
			return errors.New("ReceiptPath is required when status is 'Paid'")
		}
	} else {
		if strings.TrimSpace(m.ReceiptPath) != "" {
			return errors.New("ReceiptPath must only be provided when status is 'Paid'")
		}
	}

	return nil
}
