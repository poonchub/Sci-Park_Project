package unit

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
)

func TestNewsValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Valid News", func(t *testing.T) {
		news := entity.News{
			Title: "Title",
			Summary: "Summary",
			FullContent: "FullContent",
			DisplayStart: time.Now(),
			DisplayEnd: time.Now(),
			IsPinned: true,
			UserID: 1,
		}

		ok, err := govalidator.ValidateStruct(news)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Missing Title", func(t *testing.T) {
		news := entity.News{
			// Title: "Title",
			Summary: "Summary",
			FullContent: "FullContent",
			DisplayStart: time.Now(),
			DisplayEnd: time.Now(),
			IsPinned: true,
			UserID: 1,
		}

		ok, err := govalidator.ValidateStruct(news)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Title is required"))
	})

	t.Run("Missing Summary", func(t *testing.T) {
		news := entity.News{
			Title: "Title",
			// Summary: "Summary",
			FullContent: "FullContent",
			DisplayStart: time.Now(),
			DisplayEnd: time.Now(),
			IsPinned: true,
			UserID: 1,
		}

		ok, err := govalidator.ValidateStruct(news)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Summary is required"))
	})

	t.Run("Missing FullContent", func(t *testing.T) {
		news := entity.News{
			Title: "Title",
			Summary: "Summary",
			// FullContent: "FullContent",
			DisplayStart: time.Now(),
			DisplayEnd: time.Now(),
			IsPinned: true,
			UserID: 1,
		}

		ok, err := govalidator.ValidateStruct(news)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("FullContent is required"))
	})

	t.Run("Missing DisplayStart", func(t *testing.T) {
		news := entity.News{
			Title: "Title",
			Summary: "Summary",
			FullContent: "FullContent",
			// DisplayStart: time.Now(),
			DisplayEnd: time.Now(),
			IsPinned: true,
			UserID: 1,
		}

		ok, err := govalidator.ValidateStruct(news)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("DisplayStart is required"))
	})

	t.Run("Missing DisplayEnd", func(t *testing.T) {
		news := entity.News{
			Title: "Title",
			Summary: "Summary",
			FullContent: "FullContent",
			DisplayStart: time.Now(),
			// DisplayEnd: time.Now(),
			IsPinned: true,
			UserID: 1,
		}

		ok, err := govalidator.ValidateStruct(news)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("DisplayEnd is required"))
	})

	t.Run("Missing UserID", func(t *testing.T) {
		news := entity.News{
			Title: "Title",
			Summary: "Summary",
			FullContent: "FullContent",
			DisplayStart: time.Now(),
			DisplayEnd: time.Now(),
			IsPinned: true,
			// UserID: 1,
		}

		ok, err := govalidator.ValidateStruct(news)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("UserID is required"))
	})
}