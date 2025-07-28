import { Op, } from "sequelize";
import { getDBConnection } from "@connections/db";
import { EQueryOperator } from "@/definitions/enums";
export default class DBService {
    sequelize;
    constructor() {
        this.sequelize = getDBConnection();
    }
    buildWhere(filters = []) {
        const where = {};
        for (const { column, operator, value } of filters) {
            switch (operator) {
                case EQueryOperator.Eq:
                    where[column] = value;
                    break;
                case EQueryOperator.Neq:
                    where[column] = { [Op.ne]: value };
                    break;
                case EQueryOperator.Gt:
                    where[column] = { [Op.gt]: value };
                    break;
                case EQueryOperator.Gte:
                    where[column] = { [Op.gte]: value };
                    break;
                case EQueryOperator.Lt:
                    where[column] = { [Op.lt]: value };
                    break;
                case EQueryOperator.Lte:
                    where[column] = { [Op.lte]: value };
                    break;
                case EQueryOperator.Like:
                    where[column] = { [Op.like]: value };
                    break;
                case EQueryOperator.ILike:
                    where[column] = { [Op.iLike]: value };
                    break;
                case EQueryOperator.In:
                    where[column] = { [Op.in]: value };
                    break;
                case EQueryOperator.Is:
                    where[column] = { [Op.is]: value };
                    break;
                default:
                    where[column] = value;
            }
        }
        return where;
    }
    async query(model, { query = [], select, modifyOptions, count, }) {
        let options = { where: this.buildWhere(query) };
        if (select)
            options.attributes = select.split(",").map((s) => s.trim());
        if (modifyOptions)
            options = modifyOptions(options) || options;
        if (count) {
            const res = await model.findAndCountAll(options);
            return { data: res.rows, count: res.count };
        }
        const data = await model.findAll(options);
        return { data: data, count: null };
    }
    async insert(model, data) {
        const res = await model.create(data);
        return res.toJSON();
    }
    async updateById(model, id, data) {
        const [count, rows] = await model.update(data, {
            where: { id: id },
            returning: true,
        });
        return { data: rows[0] || null, count };
    }
    async deleteById(model, id) {
        const row = await model.findByPk(id);
        if (!row)
            return null;
        await row.destroy();
        return row.toJSON();
    }
    async deleteByQuery(model, filters, single = false) {
        const where = this.buildWhere(filters);
        if (single) {
            const row = await model.findOne({ where });
            if (!row)
                return null;
            await row.destroy();
            return row.toJSON();
        }
        await model.destroy({ where });
        return null;
    }
    async transaction(callback) {
        return this.sequelize.transaction(callback);
    }
}
//# sourceMappingURL=dbService.js.map