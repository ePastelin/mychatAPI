import { Router } from "express";
import { dashboardController } from '../controller/dashboard.controller.js'

const router = Router()

router.get('/users', dashboardController.getUsers) 
router.get('/users/top-chats', dashboardController.getTopUserStats)
router.get('/users/top-4', dashboardController.getTop4Users)
router.get('/chats/summary', dashboardController.getChatsSummary)
router.get('/chats/monthly-summary/:year', dashboardController.getMonthlySummary)
router.get('/chats/yearly-summary', dashboardController.getYearlyChats)
router.get('/messages/yearly-summary', dashboardController.getYearlyMessages)
router.get('/messages/monthly-summary/:year', dashboardController.getMonthlyMessages)
router.get('/cards', dashboardController.getCardsData)

export default router