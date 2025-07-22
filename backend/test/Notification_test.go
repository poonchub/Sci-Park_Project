package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
)

func TestNotificationValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Valid Notification", func(t *testing.T) {
		noti := entity.Notification{
			IsRead: false,
			RequestID: 1,
			TaskID: 1,
			UserID: 1,
		}

		ok, err := govalidator.ValidateStruct(noti)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Missing RequestID", func(t *testing.T) {
		noti := entity.Notification{
			IsRead: false,
			// RequestID: 1,
			TaskID: 1,
			UserID: 1,
		}

		ok, err := govalidator.ValidateStruct(noti)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("RequestID is required"))
	})

	t.Run("Missing TaskID", func(t *testing.T) {
		noti := entity.Notification{
			IsRead: false,
			RequestID: 1,
			// TaskID: 1,
			UserID: 1,
		}

		ok, err := govalidator.ValidateStruct(noti)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("TaskID is required"))
	})

	t.Run("Missing UserID", func(t *testing.T) {
		noti := entity.Notification{
			IsRead: false,
			RequestID: 1,
			TaskID: 1,
			// UserID: 1,
		}

		ok, err := govalidator.ValidateStruct(noti)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("UserID is required"))
	})
}