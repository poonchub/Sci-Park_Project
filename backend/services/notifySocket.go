package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

var socketURL = os.Getenv("SOCKET_URL")

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

	resp, err := http.Post(socketURL+"/notify-maintenance", "application/json", bytes.NewBuffer(jsonData))
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

	resp, err := http.Post("http://localhost:3001/notify-invoice", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Println("notify error:", err)
		return
	}
	defer resp.Body.Close()
}

func NotifySocketEventUser(event string, data interface{}) {
	payload := map[string]interface{}{
		"event": event,
		"data":  data,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		fmt.Println("marshal error:", err)
		return
	}

	resp, err := http.Post("http://localhost:3001/notify-user", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Println("notify error:", err)
		return
	}
	defer resp.Body.Close()
}

func NotifySocketEventServiceArea(event string, data interface{}) {
	payload := map[string]interface{}{
		"event": event,
		"data":  data,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		fmt.Println("marshal error:", err)
		return
	}

	resp, err := http.Post("http://localhost:3001/notify-service-area", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Println("notify error:", err)
		return
	}
	defer resp.Body.Close()
}

func NotifySocketEventBookingRooms(event string, data interface{}) {
	payload := map[string]interface{}{
		"event": event,
		"data":  data,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		fmt.Println("marshal error:", err)
		return
	}

	resp, err := http.Post("http://localhost:3001/notify-booking-room", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Println("notify error:", err)
		return
	}
	defer resp.Body.Close()
}