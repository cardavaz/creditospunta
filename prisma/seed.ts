import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main(){
  await prisma.payment.deleteMany();
  await prisma.installment.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.client.deleteMany();
  await prisma.client.createMany({data:[
    {documentNumber:"4.123.456-7",firstName:"María",lastName:"Rodríguez",monthlyIncome:48000,employmentYears:5,phone:"099000001"},
    {documentNumber:"3.987.654-2",firstName:"Juan",lastName:"Pérez",monthlyIncome:55000,employmentYears:3,phone:"099000002"},
    {documentNumber:"5.234.567-1",firstName:"Lucía",lastName:"Martínez",monthlyIncome:42000,employmentYears:2,phone:"099000003"}
  ]});
}
main().finally(()=>prisma.$disconnect());
