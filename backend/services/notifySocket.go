package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func NotifySocketEvent(event string, data interface{}) {
	payload := map[string]interface{}{
		"event": event,
		"data":  data,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		fmt.Println("marshal error:", err)
		return
	}

	resp, err := http.Post("http://localhost:3001/notify-maintenance", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Println("notify error:", err)
		return
	}
	defer resp.Body.Close()
}

func NotifySocketEventNews(event string, data interface{}) {
	payload := map[string]interface{}{
		"event": event,
		"data":  data,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		fmt.Println("marshal error:", err)
		return
	}

	resp, err := http.Post("http://localhost:3001/notify-news", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Println("notify error:", err)
		return
	}
	defer resp.Body.Close()
}

func NotifySocketEventInvoice(event string, data interface{}) {
	payload := map[string]interface{}{
		"event": event,
		"data":  data,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		fmt.Println("marshal error:", err)
		return
	}

	resp, err := http.Post("http://localhost:3001/notify-news", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Println("notify error:", err)
		return
	}
	defer resp.Body.Close()
}