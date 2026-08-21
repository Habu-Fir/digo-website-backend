import { Router } from 'express';
import {
    recordView,
    getViews,
} from '../controllers/statsController';

const router = Router();

router.post('/views', recordView);
router.get('/views', getViews);

export default router;