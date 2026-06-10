a=int(input())
if(a%400==0):
    print("Leap year")
elif (a%100==0):
    print("leap year")
elif(a%4==0):
    print("leap year")
else:
    print("Not leap year")