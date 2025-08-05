package controller

import (
	"io"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

// POST /proxy/slipok
func ProxySlipOK(c *gin.Context) {
	apiKey := os.Getenv("SLIPOK_API_KEY")
	branchID := os.Getenv("SLIPOK_BRANCH_ID")
	url := "https://api.slipok.com/api/line/apikey/" + branchID

	client := &http.Client{}
	req, err := http.NewRequest("POST", url, c.Request.Body)
	if err != nil {
		c.String(http.StatusInternalServerError, "Failed to create request")
		return
	}

	req.Header.Set("x-authorization", apiKey)
	req.Header.Set("Content-Type", c.Request.Header.Get("Content-Type"))

	resp, err := client.Do(req)
	if err != nil {
		c.String(http.StatusBadGateway, "Failed to call slipok")
		return
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)

	c.Header("Content-Type", "application/json")
	c.Status(resp.StatusCode)
	c.Writer.Write(bodyBytes)
}

func ProxySlipOKQuota(c *gin.Context) {
	apiKey := os.Getenv("SLIPOK_API_KEY")
	branchID := os.Getenv("SLIPOK_BRANCH_ID")
	url := "https://api.slipok.com/api/line/apikey/" + branchID + "/quota"

	log.Println("Calling SlipOK quota...")

	client := &http.Client{}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		log.Println("Failed to create request:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create request"})
		return
	}

	req.Header.Set("x-authorization", apiKey)

	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to reach slipok"})
		return
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)

	c.Header("Content-Type", "application/json")
	c.Status(resp.StatusCode)
	c.Writer.Write(bodyBytes)

}
