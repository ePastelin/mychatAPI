import { dashboardService } from "../services/dashboard.service.js"

export const dashboardController = {
   async getUsers(req, res) {
    try {
        const users = await dashboardService.getUsers();
        res.status(200).json(users)
    } catch (error) {
        res.status(500).json({ error: 'Error fetching users'})
    }
   }, 

   async getCardsData(req, res) {
    try {
        const inactiveChats = await dashboardService.getInactiveChatsGrowth();
        const activeChats = await dashboardService.getActiveChatsGrowth();
        const messages = await dashboardService.getMessagesGrowth();

        res.status(200).json({
            inactiveChats,
            activeChats,
            messages
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error fetching data' }); 
    }
   },

   async getChatsSummary(req, res) {
    try {
        const totalChats = await dashboardService.getTotalChats()
        const growth = await dashboardService.getChatsGrowth()
        res.status(200).json({ totalChats, growth })
    } catch (error) {
        res.status(500).json({ error: 'Error fetching chat summary'})
    }
   },

   async getTopUserStats(req, res) {
    try {
        const stats = await dashboardService.getTopUserStats()
        res.status(200).json(stats)
    } catch (error) {
        res.status(500).json({ error: 'Error fetching user stats'})
    }
   },

   async getMonthlySummary(req, res) {
    const { year } = req.params
    try {
       const summary = await dashboardService.getMonthlySummary(year) 
       res.status(200).json(summary)
    } catch (error) {
       res.status(500).json({ error: 'Error fetching top users'}) 
    }
   },

   async getTop4Users(req, res) {
    try {
        const topUsers = await dashboardService.getTop4Users()
        res.status(200).json(topUsers)
    } catch(error) {
        res.status(500).json({ error: 'Error fetching top users'})
    }
   },

   async getYearlyChats(req, res) {
    try {
        const stats = await dashboardService.getYearlyChatSummary()
        res.status(200).json(stats)

    } catch(error) {
        res.status(500).json({ error: 'Error fetching yearly chats'})
    }
   },

   async getYearlyMessages(req, res) {
    try {
        const stats = await dashboardService.getYearlyMessageSummary();
        res.status(200).json(stats)
    } catch (error) {
        res.status(500).json({ error: 'Error fetching yearly messages'})
    }
   },

   async getMonthlyMessages(req, res) {
    const { year } = req.params

    try {
        const stats = await dashboardService.getMonthlyMessageSummary(year)
        res.status(200).json(stats)
    } catch(error) {
        res.status(500).json( { error: 'Error featching monthly messages'})
    }
   }
}